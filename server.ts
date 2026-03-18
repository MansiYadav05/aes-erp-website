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

async function startServer() {
  try {
    const app = express();
    const PORT = 3000;

    app.use(express.json());

    // --- API Routes ---

    // Auth/User Sync
    app.post("/api/users/sync", (req, res) => {
      const { id, email, displayName, role } = req.body;
      try {
        // Check if user exists
        const existing = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as any;

        if (!existing) {
          const stmt = db.prepare(
            "INSERT INTO users (id, email, display_name, role) VALUES (?, ?, ?, ?)"
          );
          stmt.run(id, email, displayName, role || 'employee');

          // If employee, create employee record
          if ((role || 'employee') === 'employee') {
            db.prepare("INSERT INTO employees (id, first_name, last_name, email) VALUES (?, ?, ?, ?)")
              .run(id, displayName.split(' ')[0], displayName.split(' ')[1] || '', email);
          }
        } else if (role && existing.role === 'employee' && role === 'admin') {
          // Handle race condition: if user was created as employee by AuthContext sync 
          // but AuthPage signup says they should be admin, update it.
          db.prepare("UPDATE users SET role = ? WHERE id = ?").run(role, id);
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
      const { first_name, last_name, phone, address, department_id, role_title, salary_monthly, status } = req.body;
      try {
        db.prepare(`
        UPDATE employees 
        SET first_name = ?, last_name = ?, phone = ?, address = ?, 
            department_id = ?, role_title = ?, salary_monthly = ?, status = ?
        WHERE id = ?
      `).run(first_name, last_name, phone, address, department_id, role_title, salary_monthly, status, req.params.id);
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

    // Salary
    app.get("/api/salary/:employeeId", (req, res) => {
      const history = db.prepare("SELECT * FROM salary_history WHERE employee_id = ? ORDER BY payment_date DESC").all(req.params.employeeId);
      res.json(history);
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
