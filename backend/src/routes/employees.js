const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all employees
router.get('/', async (req, res) => {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching employees' });
  }
});

// Create new employee
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, role, status, baseSalary } = req.body;
    const newEmployee = await prisma.employee.create({
      data: {
        name,
        email,
        phone,
        role,
        status,
        baseSalary: parseFloat(baseSalary) || 0,
      }
    });
    res.status(201).json(newEmployee);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Error creating employee' });
  }
});

// Update employee
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, role, status, baseSalary } = req.body;
    
    const employee = await prisma.employee.update({
      where: { id },
      data: {
        name,
        email,
        phone,
        role,
        status,
        baseSalary: parseFloat(baseSalary) || 0,
      }
    });
    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: 'Error updating employee' });
  }
});

// Delete employee
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.employee.delete({
      where: { id }
    });
    res.json({ message: 'Employee deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting employee' });
  }
});

// Get attendance for an employee
router.get('/:id/attendance', async (req, res) => {
  try {
    const { id } = req.params;
    const records = await prisma.attendance.findMany({
      where: { employeeId: id },
      orderBy: { date: 'desc' },
      take: 30
    });
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching attendance' });
  }
});

// Add attendance
router.post('/:id/attendance', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, status, notes } = req.body;
    const record = await prisma.attendance.create({
      data: {
        employeeId: id,
        date: new Date(date),
        status,
        notes
      }
    });
    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ error: 'Error adding attendance' });
  }
});

// Get salaries for an employee
router.get('/:id/salary', async (req, res) => {
  try {
    const { id } = req.params;
    const records = await prisma.salaryRecord.findMany({
      where: { employeeId: id },
      orderBy: { paymentDate: 'desc' }
    });
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching salary records' });
  }
});

// Add salary record
router.post('/:id/salary', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, bonus, deduction, paymentDate, status } = req.body;
    const record = await prisma.salaryRecord.create({
      data: {
        employeeId: id,
        amount: parseFloat(amount) || 0,
        bonus: parseFloat(bonus) || 0,
        deduction: parseFloat(deduction) || 0,
        paymentDate: new Date(paymentDate),
        status
      }
    });
    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ error: 'Error adding salary record' });
  }
});

module.exports = router;
