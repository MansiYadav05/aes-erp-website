import express from "express";
import "dotenv/config";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import { getApps, initializeApp } from "firebase-admin/app";
import { DecodedIdToken, getAuth } from "firebase-admin/auth";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "database", "erp.db");
const schemaPath = path.join(__dirname, "database", "schema.sql");

// Ensure database directory exists
try {
  if (!fs.existsSync(path.join(__dirname, "database"))) {
    fs.mkdirSync(path.join(__dirname, "database"), { recursive: true });
  }
} catch (e) {
  console.warn("Database directory creation skipped (expected in some serverless environments)");
}

const db = new Database(dbPath);

const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const firebaseAdminApp = getApps()[0] || initializeApp({
  projectId: process.env.FIREBASE_PROJECT_ID || 'aes-webpage'
});
const firebaseAdminAuth = getAuth(firebaseAdminApp);

async function verifyRequestUser(req: express.Request, res: express.Response, adminOnly = false): Promise<DecodedIdToken | null> {
  if (adminOnly && !adminEmail) {
    res.status(503).json({ error: 'Primary admin email is not configured on the server' });
    return null;
  }

  const authorization = req.headers.authorization;
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return null;
  }

  try {
    const decoded = await firebaseAdminAuth.verifyIdToken(token);
    if (adminOnly && decoded.email?.toLowerCase() !== adminEmail) {
      res.status(403).json({ error: 'Only the primary administrator can review requests' });
      return null;
    }
    return decoded;
  } catch {
    res.status(401).json({ error: 'Invalid or expired authentication token' });
    return null;
  }
}

// Initialize database with schema
const schema = fs.readFileSync(schemaPath, "utf8");
db.exec(schema);

// Migration: Ensure columns added in newer schema versions exist in the database
const tableInfo = db.prepare("PRAGMA table_info(employees)").all() as { name: string }[];
const columnNames = tableInfo.map(c => c.name);

if (!columnNames.includes('salary_monthly')) {
  db.prepare("ALTER TABLE employees ADD COLUMN salary_monthly REAL DEFAULT 0").run();
}
if (!columnNames.includes('task_bonus_rate')) {
  db.prepare("ALTER TABLE employees ADD COLUMN task_bonus_rate REAL DEFAULT 50.0").run();
}
if (!columnNames.includes('availability_status')) {
  db.prepare("ALTER TABLE employees ADD COLUMN availability_status TEXT NOT NULL DEFAULT 'On Duty'").run();
}

// Helper: Haversine Formula for Distance Calculation (in meters)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const app = express();
const PORT = process.env.PORT || 3000;

async function setupApp() {
  app.use(express.json());

  // --- API Routes ---

  // Health check for keep-alive pings
  app.get("/api/health", (req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Auth/User Sync
  app.post("/api/users/sync", (req, res) => {
    void (async () => {
      const identity = await verifyRequestUser(req, res);
      if (!identity) return;

      const id = identity.uid;
      const email = identity.email;
      const displayName = req.body?.displayName;
      const { phone, address } = req.body ?? {};
      const normalizedDisplayName = typeof displayName === 'string' ? displayName.trim() : '';
      try {
        // Check if user exists
        const existing = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as any;
        const primaryAdmin = Boolean(adminEmail) && email?.toLowerCase() === adminEmail;
        const approvedRequest = db.prepare("SELECT id FROM admin_access_requests WHERE user_id = ? AND status = 'approved'").get(id);
        const resolvedRole = primaryAdmin || approvedRequest ? 'admin' : 'employee';

        if (!existing) {
          const stmt = db.prepare(
            "INSERT INTO users (id, email, display_name, role) VALUES (?, ?, ?, ?)"
          );
          const resolvedDisplayName = normalizedDisplayName || email?.split('@')[0] || '';
          stmt.run(id, email, resolvedDisplayName, resolvedRole);

          // If employee, create employee record with all details
          if (resolvedRole === 'employee') {
            const nameParts = resolvedDisplayName ? resolvedDisplayName.split(' ') : [''];
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(' ');
            db.prepare("INSERT INTO employees (id, first_name, last_name, email, phone, address) VALUES (?, ?, ?, ?, ?, ?)")
              .run(id, firstName, lastName, email, phone, address);
          }
        } else {
          db.prepare("UPDATE users SET role = ? WHERE id = ?").run(resolvedRole, id);
          if (normalizedDisplayName) {
            const nameParts = normalizedDisplayName.split(/\s+/);
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(' ');
            db.prepare("UPDATE users SET display_name = ? WHERE id = ?").run(normalizedDisplayName, id);
            db.prepare("UPDATE employees SET first_name = ?, last_name = ? WHERE id = ?")
              .run(firstName, lastName, id);
          }
          // Update employee details if provided
          if (phone || address) {
            const employeeExists = db.prepare("SELECT id FROM employees WHERE id = ?").get(id);
            if (employeeExists) {
              let updateQuery = "UPDATE employees SET ";
              const params = [];
              if (phone) {
                updateQuery += "phone = ?";
                params.push(phone);
              }
              if (address) {
                updateQuery += (phone ? ", " : "") + "address = ?";
                params.push(address);
              }
              updateQuery += " WHERE id = ?";
              params.push(id);
              db.prepare(updateQuery).run(...params);
            }
          }
          if (resolvedRole === 'employee') {
            const employeeExists = db.prepare("SELECT id FROM employees WHERE id = ?").get(id);
            if (!employeeExists) {
              const resolvedDisplayName = normalizedDisplayName || existing.display_name || email?.split('@')[0] || '';
              const nameParts = resolvedDisplayName.split(' ');
              db.prepare("INSERT INTO employees (id, first_name, last_name, email, phone, address) VALUES (?, ?, ?, ?, ?, ?)")
                .run(id, nameParts[0], nameParts.slice(1).join(' '), email, phone, address);
            }
          }
        }

        const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
        res.json({ success: true, user });
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    })();
  });

  app.post("/api/admin-access-requests", (req, res) => {
    void (async () => {
      const identity = await verifyRequestUser(req, res);
      if (!identity) return;

      const requestEmail = identity.email?.trim().toLowerCase();
      if (!requestEmail) return res.status(400).json({ error: 'Authenticated account has no email address' });
      if (!adminEmail) return res.status(503).json({ error: 'Admin access review is not configured on the server' });

      try {
        const account = db.prepare("SELECT role, display_name FROM users WHERE id = ?").get(identity.uid) as { role: string; display_name: string | null } | undefined;
        if (!account) return res.status(404).json({ error: 'Account profile not found' });
        if (requestEmail === adminEmail || account.role === 'admin') {
          return res.json({ approved: true });
        }

        const currentRequest = db.prepare(`
          SELECT id FROM admin_access_requests
          WHERE user_id = ? AND status = 'pending'
        `).get(identity.uid) as { id: number } | undefined;
        if (currentRequest) return res.json({ approved: false, pending: true });

        const employee = db.prepare("SELECT phone FROM employees WHERE id = ?").get(identity.uid) as { phone: string | null } | undefined;
        const displayName = identity.name?.trim() || account.display_name || requestEmail.split('@')[0];
        db.prepare(`
          INSERT INTO admin_access_requests (user_id, email, display_name, phone, status)
          VALUES (?, ?, ?, ?, 'pending')
        `).run(identity.uid, requestEmail, displayName, employee?.phone || null);
        return res.json({ approved: false, pending: true });
      } catch (error) {
        return res.status(500).json({ error: (error as Error).message });
      }
    })();
  });

  app.get("/api/admin-access-requests", (req, res) => {
    void (async () => {
      const identity = await verifyRequestUser(req, res, true);
      if (!identity) return;
      try {
        const requests = db.prepare(`
          SELECT id, user_id, email, display_name, phone, requested_at
          FROM admin_access_requests
          WHERE status = 'pending'
          ORDER BY requested_at ASC
        `).all();
        res.json(requests);
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    })();
  });

  app.patch("/api/admin-access-requests/:id", (req, res) => {
    void (async () => {
      const identity = await verifyRequestUser(req, res, true);
      if (!identity) return;

      const { action } = req.body ?? {};
      if (action !== 'approve' && action !== 'cancel') {
        return res.status(400).json({ error: 'Action must be approve or cancel' });
      }

      try {
        const transaction = db.transaction(() => {
          const request = db.prepare(`
            SELECT user_id FROM admin_access_requests
            WHERE id = ? AND status = 'pending'
          `).get(req.params.id) as { user_id: string } | undefined;
          if (!request) return false;

          if (action === 'approve') {
            const accountUpdate = db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(request.user_id);
            if (!accountUpdate.changes) return false;
          }

          db.prepare(`
            UPDATE admin_access_requests
            SET status = ?, reviewed_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).run(action === 'approve' ? 'approved' : 'cancelled', req.params.id);
          return true;
        });

        if (!transaction()) return res.status(404).json({ error: 'Pending request not found' });
        return res.json({ success: true, status: action === 'approve' ? 'approved' : 'cancelled' });
      } catch (error) {
        return res.status(500).json({ error: (error as Error).message });
      }
    })();
  });

  // Employees
  app.get("/api/employees", (req, res) => {
    const employees = db.prepare(`
      SELECT e.*, d.name as department_name, u.role
      FROM employees e 
      JOIN users u ON e.id = u.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE u.role = 'employee'
    `).all();
    res.json(employees);
  });

  app.get("/api/employees/:id", (req, res) => {
    const employee = db.prepare(`
      SELECT e.*, d.name as department_name, u.role
      FROM employees e 
      JOIN users u ON e.id = u.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE e.id = ?
    `).get(req.params.id);
    res.json(employee);
  });

  app.patch("/api/employees/:id/availability", (req, res) => {
    const allowedStatuses = ['On Duty', 'On Break', 'Away', 'Off Duty'];
    const { availability_status } = req.body ?? {};

    if (!allowedStatuses.includes(availability_status)) {
      return res.status(400).json({ error: 'Invalid availability status' });
    }

    try {
      const result = db.prepare(`
        UPDATE employees
        SET availability_status = ?
        WHERE id = ? AND EXISTS (
          SELECT 1 FROM users WHERE users.id = employees.id AND users.role = 'employee'
        )
      `).run(availability_status, req.params.id);

      if (result.changes === 0) {
        return res.status(404).json({ error: 'Employee not found' });
      }

      res.json({ success: true, availability_status: availability_status });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.put("/api/employees/:id", (req, res) => {
    const body = req.body ?? {};
    const { first_name, last_name, department_id, role_title, salary_monthly, task_bonus_rate, status, role } = body;

    const sanitizedFirstName = first_name || '';
    const sanitizedLastName = last_name || '';
    const deptIdNumber = Number(department_id);
    const sanitizedDeptId = (department_id === '' || department_id === null || department_id === undefined || isNaN(deptIdNumber)) ? null : deptIdNumber;
    const sanitizedRoleTitle = role_title || null;
    const sanitizedSalary = isNaN(parseFloat(String(salary_monthly))) ? 0 : parseFloat(String(salary_monthly));
    const sanitizedBonus = isNaN(parseFloat(String(task_bonus_rate))) ? 50 : parseFloat(String(task_bonus_rate));
    const sanitizedStatus = status ?? null;
    const sanitizedRole = role || 'employee';

    try {
      const transaction = db.transaction(() => {
        // Perform the update. We don't throw if changes === 0 because if the user
        // saves without changing any data, SQLite might report 0 rows modified.
        db.prepare(`
          UPDATE employees 
          SET first_name = ?, last_name = ?, 
              department_id = ?, role_title = ?, salary_monthly = ?, task_bonus_rate = ?, status = COALESCE(?, status)
          WHERE id = ?
        `).run(sanitizedFirstName, sanitizedLastName, sanitizedDeptId, sanitizedRoleTitle, sanitizedSalary, sanitizedBonus, sanitizedStatus, req.params.id);

        if (sanitizedRole) {
          db.prepare(`
            UPDATE users
            SET role = ?
            WHERE id = ?
          `).run(sanitizedRole, req.params.id);
        }
      });
      transaction();
      const employee = db.prepare(`
      SELECT e.*, d.name as department_name, u.role
      FROM employees e 
      JOIN users u ON e.id = u.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE e.id = ?
    `).get(req.params.id);
      res.json(employee);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.delete("/api/employees/:id", (req, res) => {
    try {
      const transaction = db.transaction(() => {
        // Delete related records to maintain database integrity
        db.prepare("DELETE FROM attendance WHERE employee_id = ?").run(req.params.id);
        db.prepare("DELETE FROM salary_history WHERE employee_id = ?").run(req.params.id);
        db.prepare("DELETE FROM tasks WHERE assigned_to = ?").run(req.params.id);
        db.prepare("DELETE FROM employees WHERE id = ?").run(req.params.id);
        db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);
      });
      transaction();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Tasks
  app.get("/api/tasks", (req, res) => {
    const { employeeId } = req.query;
    let query = "SELECT t.*, e.first_name || ' ' || e.last_name as employee_name FROM tasks t LEFT JOIN employees e ON t.assigned_to = e.id";
    let params: any[] = [];

    if (employeeId) {
      query += " WHERE t.assigned_to = ?";
      params.push(employeeId);
    }

    const tasks = db.prepare(query).all(...params);
    res.json(tasks);
  });

  app.post("/api/tasks", (req, res) => {
    const { title, description, assigned_to, deadline } = req.body;
    try {
      const stmt = db.prepare("INSERT INTO tasks (title, description, assigned_to, deadline) VALUES (?, ?, ?, ?)");
      const result = stmt.run(title, description, assigned_to, deadline);
      res.json({ id: result.lastInsertRowid });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.put("/api/tasks/:id", (req, res) => {
    const { status } = req.body;
    try {
      db.prepare("UPDATE tasks SET status = ? WHERE id = ?").run(status, req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Notifications
  app.get("/api/notifications", (req, res) => {
    const { userId } = req.query;
    let query = "SELECT * FROM notifications WHERE user_id IS NULL";
    let params: any[] = [];

    if (userId) {
      query += " OR user_id = ?";
      params.push(userId);
    }

    query += " ORDER BY created_at DESC";
    const notifications = db.prepare(query).all(...params);
    res.json(notifications);
  });

  app.post("/api/notifications", (req, res) => {
    const { user_id, department_id, title, message } = req.body ?? {};
    try {
      if (!title || !message) {
        return res.status(400).json({ error: 'Notification title and message are required' });
      }

      if (department_id !== undefined && department_id !== null) {
        const departmentId = Number(department_id);
        if (!Number.isInteger(departmentId)) {
          return res.status(400).json({ error: 'Invalid department' });
        }

        const employeeIds = db.prepare(`
          SELECT e.id
          FROM employees e
          JOIN users u ON u.id = e.id
          WHERE e.department_id = ? AND u.role = 'employee'
        `).all(departmentId) as { id: string }[];

        if (employeeIds.length === 0) {
          return res.status(400).json({ error: 'No employees are assigned to this department' });
        }

        const insertNotification = db.prepare(
          "INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)"
        );
        const sendToDepartment = db.transaction(() => {
          for (const employee of employeeIds) {
            insertNotification.run(employee.id, title, message);
          }
        });
        sendToDepartment();
        return res.json({ success: true, recipientCount: employeeIds.length });
      }

      if (user_id) {
        const employee = db.prepare(`
          SELECT e.id FROM employees e
          JOIN users u ON u.id = e.id
          WHERE e.id = ? AND u.role = 'employee'
        `).get(user_id);
        if (!employee) return res.status(404).json({ error: 'Employee not found' });

        db.prepare("INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)")
          .run(user_id, title, message);
        return res.json({ success: true, recipientCount: 1 });
      }

      const employees = db.prepare(`
        SELECT e.id FROM employees e
        JOIN users u ON u.id = e.id
        WHERE u.role = 'employee'
      `).all() as { id: string }[];
      const insertNotification = db.prepare(
        "INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)"
      );
      const sendToAll = db.transaction(() => {
        for (const employee of employees) {
          insertNotification.run(employee.id, title, message);
        }
      });
      sendToAll();
      res.json({ success: true, recipientCount: employees.length });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Attendance
  app.get("/api/attendance", (_req, res) => {
    try {
      const query = `
          SELECT a.*, (e.first_name || ' ' || e.last_name) as employee_name 
          FROM attendance a
          JOIN employees e ON a.employee_id = e.id
          ORDER BY a.date DESC
        `;
      const records = db.prepare(query).all();
      res.json(records);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/attendance/:employeeId", (req, res) => {
    const records = db.prepare("SELECT * FROM attendance WHERE employee_id = ?").all(req.params.employeeId);
    res.json(records);
  });

  app.post("/api/attendance", (req, res) => {
    const { employee_id, status, date } = req.body;
    try {
      db.prepare("INSERT OR REPLACE INTO attendance (employee_id, status, date) VALUES (?, ?, ?)")
        .run(employee_id, status, date || new Date().toISOString().split('T')[0]);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Geo-Fence Settings Management
  app.get("/api/settings/geo", (req, res) => {
    const settings = db.prepare("SELECT * FROM workplace_settings LIMIT 1").get();
    res.json(settings);
  });

  app.put("/api/settings/geo", (req, res) => {
    const { lat, lng, radius } = req.body;
    try {
      db.prepare("UPDATE workplace_settings SET lat = ?, lng = ?, allowed_radius_meters = ? WHERE id = 1")
        .run(lat, lng, radius);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Geo-Fenced Attendance
  app.post("/api/attendance/geo", (req, res) => {
    const { employee_id, lat, lng } = req.body;

    try {
      const settings = db.prepare("SELECT * FROM workplace_settings LIMIT 1").get() as any;
      if (!settings) {
        throw new Error("Workplace settings not configured in database.");
      }

      const distance = calculateDistance(lat, lng, settings.lat, settings.lng);
      const isInside = distance <= settings.allowed_radius_meters;
      // Log attempt
      db.prepare("INSERT INTO attendance_logs (employee_id, lat, lng, distance, status) VALUES (?, ?, ?, ?, ?)")
        .run(employee_id, lat, lng, distance, isInside ? 'Present' : 'Rejected');

      if (isInside) {
        // Check if already marked
        const date = new Date().toISOString().split('T')[0];
        try {
          db.prepare("INSERT INTO attendance (employee_id, status, date) VALUES (?, 'present', ?)")
            .run(employee_id, date);
          res.json({ success: true, message: "Attendance marked successfully!", distance });
        } catch (e) {
          // Likely unique constraint violation
          res.json({ success: true, message: "Attendance already marked for today.", distance });
        }
      } else {
        res.status(403).json({
          success: false,
          error: "You are not within workplace boundary.",
          distance: Math.round(distance)
        });
      }
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Salary
  app.get("/api/salary/:employeeId", (req, res) => {
    const history = db.prepare("SELECT * FROM salary_history WHERE employee_id = ? ORDER BY payment_date DESC").all(req.params.employeeId);
    res.json(history);
  });

  app.post("/api/salary", (req, res) => {
    const { employee_id, amount, bonus, payment_date, month_year } = req.body;
    try {
      db.prepare("INSERT INTO salary_history (employee_id, amount, bonus, payment_date, month_year) VALUES (?, ?, ?, ?, ?)")
        .run(employee_id, amount, bonus, payment_date, month_year);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Inquiries
  app.get("/api/inquiries", (req, res) => {
    const inquiries = db.prepare("SELECT * FROM inquiries ORDER BY created_at DESC").all();
    res.json(inquiries);
  });

  app.put("/api/inquiries/:id", (req, res) => {
    const { status } = req.body;
    try {
      db.prepare("UPDATE inquiries SET status = ? WHERE id = ?").run(status, req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.delete("/api/inquiries/:id", (req, res) => {
    try {
      db.prepare("DELETE FROM inquiries WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Website Content
  app.get("/api/content/:id", (req, res) => {
    const content = db.prepare("SELECT * FROM website_content WHERE id = ?").get(req.params.id);
    res.json(content ? JSON.parse((content as any).content) : null);
  });

  app.post("/api/content/:id", (req, res) => {
    try {
      db.prepare("INSERT OR REPLACE INTO website_content (id, content) VALUES (?, ?)")
        .run(req.params.id, JSON.stringify(req.body));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Departments
  app.get("/api/departments", (req, res) => {
    const departments = db.prepare("SELECT * FROM departments").all();
    res.json(departments);
  });

  // Machines
  app.get("/api/machines", (req, res) => {
    const machines = db.prepare(`
      SELECT m.*, 
             (SELECT u.display_name 
              FROM order_items oi 
              JOIN orders o ON oi.order_id = o.id 
              JOIN users u ON o.user_id = u.id 
              WHERE oi.machine_id = m.id 
              LIMIT 1) as sold_to
      FROM machines m
    `).all();
    res.json(machines);
  });

  app.post("/api/machines", (req, res) => {
    const { name, model_number, description, specifications, price, stock_quantity } = req.body;
    try {
      const result = db.prepare(`
          INSERT INTO machines (name, model_number, description, specifications, price, stock_quantity)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(name, model_number, description, specifications, price, stock_quantity);
      res.json({ id: result.lastInsertRowid });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.put("/api/machines/:id", (req, res) => {
    const { name, model_number, description, specifications, price, stock_quantity } = req.body;
    try {
      db.prepare(`
          UPDATE machines SET name = ?, model_number = ?, description = ?, specifications = ?, price = ?, stock_quantity = ?
          WHERE id = ?
        `).run(name, model_number, description, specifications, price, stock_quantity, req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.delete("/api/machines/:id", (req, res) => {
    db.prepare("DELETE FROM machines WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Dashboard Stats
  app.get("/api/stats", (req, res) => {
    const totalEmployees = db.prepare("SELECT COUNT(*) as count FROM employees").get() as { count: number };
    const totalInquiries = db.prepare("SELECT COUNT(*) as count FROM inquiries WHERE status = 'new'").get() as { count: number };
    const totalTasks = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status != 'completed'").get() as { count: number };

    res.json({
      employees: totalEmployees.count,
      inquiries: totalInquiries.count,
      tasks: totalTasks.count
    });
  });

  // Contact Inquiries
  app.post("/api/contact", (req, res) => {
    const { name, email, phone, companyName, city, productName, reason, meeting_time } = req.body;
    try {
      const stmt = db.prepare(`
        INSERT INTO inquiries (name, email, phone, company_name, city, product_name, reason, meeting_time)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const result = stmt.run(name, email, phone, companyName, city, productName, reason, meeting_time);
      res.json({ success: true, id: result.lastInsertRowid });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Newsletter Management
  app.get("/api/newsletter/subscribers", (req, res) => {
    try {
      const subscribers = db.prepare("SELECT * FROM newsletter_subscriptions ORDER BY subscribed_at DESC").all();
      res.json(subscribers);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/newsletter/send", (req, res) => {
    const { subject, message } = req.body;
    try {
      const subscribers = db.prepare("SELECT email FROM newsletter_subscriptions").all() as { email: string }[];

      if (subscribers.length === 0) {
        return res.status(400).json({ error: "No subscribers found to send to." });
      }

      // Note: Actual email dispatching logic (e.g., via Nodemailer) should be implemented here.
      console.log(`Newsletter Broadcast: Sending "${subject}" to ${subscribers.length} recipients.`);

      res.json({ success: true, recipientCount: subscribers.length });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Newsletter
  app.post("/api/newsletter/subscribe", (req, res) => {
    const { email } = req.body;
    try {
      db.prepare("INSERT INTO newsletter_subscriptions (email) VALUES (?)").run(email);
      res.json({ success: true });
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        res.status(400).json({ error: "Email already subscribed" });
      } else {
        res.status(500).json({ error: (error as Error).message });
      }
    }
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }
}

// Initialize the app configuration
await setupApp();

// Only listen on a port if we're not on Vercel (local dev or traditional VPS)
if (!process.env.VERCEL) {
  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Export the app for Vercel serverless functions
export default app;
