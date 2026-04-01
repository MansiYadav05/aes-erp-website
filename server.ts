import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "database", "erp.db");
const schemaPath = path.join(__dirname, "database", "schema.sql");

// Ensure database directory exists
if (!fs.existsSync(path.join(__dirname, "database"))) {
  fs.mkdirSync(path.join(__dirname, "database"));
}

const db = new Database(dbPath);

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

async function startServer() {
  try {
    const app = express();
    const PORT = 3000;

    app.use(express.json());

    // --- API Routes ---

    // Auth/User Sync
    app.post("/api/users/sync", (req, res) => {
      const { id, email, displayName, role, phone, address } = req.body;
      try {
        // Check if user exists
        const existing = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as any;

        if (!existing) {
          const stmt = db.prepare(
            "INSERT INTO users (id, email, display_name, role) VALUES (?, ?, ?, ?)"
          );
          stmt.run(id, email, displayName, role || 'employee');

          // If employee, create employee record with all details
          if ((role || 'employee') === 'employee') {
            const nameParts = displayName ? displayName.split(' ') : [''];
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(' ');
            db.prepare("INSERT INTO employees (id, first_name, last_name, email, phone, address) VALUES (?, ?, ?, ?, ?, ?)")
              .run(id, firstName, lastName, email, phone, address);
          }
        } else {
          // User exists, check for updates
          if (role && existing.role !== role) {
            db.prepare("UPDATE users SET role = ? WHERE id = ?").run(role, id);
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
        }

        const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
        res.json({ success: true, user });
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    });

    // Employees
    app.get("/api/employees", (req, res) => {
      const employees = db.prepare(`
      SELECT e.*, d.name as department_name, u.role
      FROM employees e 
      JOIN users u ON e.id = u.id
      LEFT JOIN departments d ON e.department_id = d.id
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

    app.put("/api/employees/:id", (req, res) => {
      const body = req.body ?? {};
      const {
        first_name,
        last_name,
        department_id,
        role_title,
        salary_monthly,
        task_bonus_rate,
        status,
        role
      } = body;

      const sanitizedFirstName = first_name || '';
      const sanitizedLastName = last_name || '';
      const deptIdNumber = Number(department_id);
      const sanitizedDeptId = (department_id === '' || department_id === null || department_id === undefined || isNaN(deptIdNumber)) ? null : deptIdNumber;
      const sanitizedRoleTitle = role_title || null;
      const sanitizedSalary = isNaN(parseFloat(String(salary_monthly))) ? 0 : parseFloat(String(salary_monthly));
      const sanitizedBonus = isNaN(parseFloat(String(task_bonus_rate))) ? 50 : parseFloat(String(task_bonus_rate));
      const sanitizedStatus = status || 'active';
      const sanitizedRole = role || 'employee';

      try {
        const transaction = db.transaction(() => {
          // Perform the update. We don't throw if changes === 0 because if the user 
          // saves without changing any data, SQLite might report 0 rows modified.
          db.prepare(`
          UPDATE employees 
          SET first_name = ?, last_name = ?, 
              department_id = ?, role_title = ?, salary_monthly = ?, task_bonus_rate = ?, status = ?
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
      const { user_id, title, message } = req.body;
      try {
        db.prepare("INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)")
          .run(user_id || null, title, message);
        res.json({ success: true });
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

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
