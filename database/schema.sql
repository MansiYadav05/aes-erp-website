-- Users table (for portal access)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    role TEXT DEFAULT 'employee', -- 'employee', 'admin'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Employees table (extended profile)
CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY, -- Matches users.id
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    address TEXT,
    department_id INTEGER,
    role_title TEXT,
    salary_monthly REAL DEFAULT 0,
    hire_date DATE DEFAULT CURRENT_DATE,
    status TEXT DEFAULT 'active',
    FOREIGN KEY (id) REFERENCES users (id),
    FOREIGN KEY (department_id) REFERENCES departments (id)
);

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    description TEXT
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    assigned_to TEXT, -- employee id
    deadline DATE,
    status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_to) REFERENCES employees (id)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT, -- Target user (null for broadcast)
    title TEXT,
    message TEXT,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id TEXT,
    date DATE DEFAULT CURRENT_DATE,
    status TEXT, -- 'present', 'absent', 'leave'
    FOREIGN KEY (employee_id) REFERENCES employees (id),
    UNIQUE (employee_id, date)
);

-- Salary History table
CREATE TABLE IF NOT EXISTS salary_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id TEXT,
    amount REAL,
    bonus REAL DEFAULT 0,
    payment_date DATE DEFAULT CURRENT_DATE,
    month_year TEXT, -- e.g., 'March 2024'
    FOREIGN KEY (employee_id) REFERENCES employees (id)
);

-- Contact Inquiries table
CREATE TABLE IF NOT EXISTS inquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    reason TEXT NOT NULL,
    meeting_time DATETIME,
    status TEXT DEFAULT 'new', -- 'new', 'responded'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Website Content table
CREATE TABLE IF NOT EXISTS website_content (
    id TEXT PRIMARY KEY,
    content TEXT -- JSON string
);

-- Machines/Products table
CREATE TABLE IF NOT EXISTS machines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    model_number TEXT UNIQUE NOT NULL,
    description TEXT,
    specifications TEXT, -- JSON string
    price REAL,
    stock_quantity INTEGER DEFAULT 0
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'shipped', 'delivered'
    total_amount REAL,
    shipping_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

-- Order Items table
CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    machine_id INTEGER NOT NULL,
    quantity INTEGER DEFAULT 1,
    price_at_time REAL,
    FOREIGN KEY (order_id) REFERENCES orders (id),
    FOREIGN KEY (machine_id) REFERENCES machines (id)
);

-- Seed data for Departments
INSERT OR IGNORE INTO
    departments (name, description)
VALUES (
        'Production',
        'Manufacturing and assembly of machinery'
    ),
    (
        'Quality Control',
        'Ensuring products meet standards'
    ),
    (
        'Sales',
        'Customer relations and order processing'
    ),
    (
        'Maintenance',
        'Service and repair of machinery'
    ),
    (
        'Human Resources',
        'Employee management and recruitment'
    );

-- Seed data for Machines
INSERT OR IGNORE INTO
    machines (
        name,
        model_number,
        description,
        specifications,
        price,
        stock_quantity
    )
VALUES (
        'Hydraulic Press X1',
        'HP-X1-2024',
        'High-pressure hydraulic press for heavy metal forming.',
        '{"capacity": "500 Tons", "power": "50HP", "weight": "12 Tons"}',
        45000.00,
        5
    ),
    (
        'CNC Milling Center',
        'CNC-MC-500',
        'Precision 5-axis CNC milling center for complex parts.',
        '{"spindle_speed": "12000 RPM", "travel": "500x400x400mm", "accuracy": "0.005mm"}',
        85000.00,
        3
    ),
    (
        'Industrial Robot Arm',
        'IRA-V6',
        '6-axis industrial robot for assembly and welding.',
        '{"payload": "20kg", "reach": "1.8m", "repeatability": "0.02mm"}',
        32000.00,
        8
    ),
    (
        'Laser Cutting System',
        'LCS-PRO-3000',
        'Fiber laser cutting system for high-speed sheet metal processing.',
        '{"power": "3kW", "bed_size": "3000x1500mm", "thickness": "20mm"}',
        120000.00,
        2
    );

-- Seed data for Users (Customers)
INSERT OR IGNORE INTO
    users (id, email, display_name, role)
VALUES (
        'cust_1',
        'procurement@tesla.com',
        'Tesla Motors',
        'user'
    ),
    (
        'cust_2',
        'orders@caterpillar.com',
        'Caterpillar Inc.',
        'user'
    ),
    (
        'cust_3',
        'supply@boeing.com',
        'Boeing Aerospace',
        'user'
    );

-- Seed data for Orders (to show 'Sold To')
INSERT OR IGNORE INTO
    orders (
        id,
        user_id,
        status,
        total_amount,
        shipping_address
    )
VALUES (
        1,
        'cust_1',
        'delivered',
        45000.00,
        'Tesla Gigafactory, Austin, TX'
    ),
    (
        2,
        'cust_2',
        'delivered',
        85000.00,
        'CAT Facility, Peoria, IL'
    ),
    (
        3,
        'cust_3',
        'shipped',
        32000.00,
        'Boeing Assembly Plant, Everett, WA'
    );

-- Seed data for Order Items
INSERT OR IGNORE INTO
    order_items (
        order_id,
        machine_id,
        quantity,
        price_at_time
    )
VALUES (1, 1, 1, 45000.00),
    (2, 2, 1, 85000.00),
    (3, 3, 1, 32000.00);