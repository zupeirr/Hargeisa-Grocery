import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { 
  getEmployees, createEmployee, updateEmployee, deleteEmployee,
  getEmployeeAttendance, addEmployeeAttendance,
  getEmployeeSalaries, addEmployeeSalary
} from '../../data/adminStore';

export default function EmployeesPage() {
  const [activeTab, setActiveTab] = useState<'employees' | 'attendance' | 'payroll'>('employees');
  const [isLoading, setIsLoading] = useState(true);

  // Employees State
  const [employees, setEmployees] = useState<any[]>([]);
  const [isEditingEmployee, setIsEditingEmployee] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<any>(null);

  // Attendance State
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [attendanceForm, setAttendanceForm] = useState({ date: new Date().toISOString().split('T')[0], status: 'present', notes: '' });

  // Payroll State
  const [salaryRecords, setSalaryRecords] = useState<any[]>([]);
  const [salaryForm, setSalaryForm] = useState({ amount: 0, bonus: 0, deduction: 0, paymentDate: new Date().toISOString().split('T')[0], status: 'paid' });

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (selectedEmployeeId) {
      if (activeTab === 'attendance') {
        fetchAttendance(selectedEmployeeId);
      } else if (activeTab === 'payroll') {
        fetchSalaries(selectedEmployeeId);
      }
    }
  }, [activeTab, selectedEmployeeId]);

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const data = await getEmployees();
      setEmployees(data);
      if (data.length > 0 && !selectedEmployeeId) {
        setSelectedEmployeeId(data[0].id);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAttendance = async (id: string) => {
    try {
      const data = await getEmployeeAttendance(id);
      setAttendanceRecords(data);
    } catch (err) {
      console.error('Error fetching attendance:', err);
    }
  };

  const fetchSalaries = async (id: string) => {
    try {
      const data = await getEmployeeSalaries(id);
      setSalaryRecords(data);
    } catch (err) {
      console.error('Error fetching salaries:', err);
    }
  };

  // --- Employee Handlers ---
  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentEmployee.id) {
        await updateEmployee(currentEmployee.id, currentEmployee);
      } else {
        await createEmployee(currentEmployee);
      }
      setIsEditingEmployee(false);
      setCurrentEmployee(null);
      fetchEmployees();
    } catch (err) {
      alert('Failed to save employee');
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (confirm('Are you sure you want to delete this employee?')) {
      try {
        await deleteEmployee(id);
        if (selectedEmployeeId === id) setSelectedEmployeeId('');
        fetchEmployees();
      } catch (err) {
        alert('Failed to delete employee');
      }
    }
  };

  // --- Attendance Handlers ---
  const handleSaveAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId) return;
    try {
      await addEmployeeAttendance(selectedEmployeeId, attendanceForm);
      fetchAttendance(selectedEmployeeId);
      setAttendanceForm({ ...attendanceForm, notes: '' });
    } catch (err) {
      alert('Failed to save attendance');
    }
  };

  // --- Payroll Handlers ---
  const handleSaveSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId) return;
    try {
      await addEmployeeSalary(selectedEmployeeId, salaryForm);
      fetchSalaries(selectedEmployeeId);
      setSalaryForm({ ...salaryForm, amount: 0, bonus: 0, deduction: 0 });
    } catch (err) {
      alert('Failed to save salary');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Employee Management</h1>
        <div className="flex space-x-2 bg-gray-800 p-1 rounded-lg border border-gray-700">
          <button
            onClick={() => setActiveTab('employees')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'employees' ? 'bg-gray-700 shadow-sm text-green-500' : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            Directory
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'attendance' ? 'bg-gray-700 shadow-sm text-green-500' : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            Attendance
          </button>
          <button
            onClick={() => setActiveTab('payroll')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'payroll' ? 'bg-gray-700 shadow-sm text-green-500' : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            Payroll
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div></div>
      ) : activeTab === 'employees' ? (
        <>
          <div className="flex justify-end">
            <button
              onClick={() => {
                setCurrentEmployee({ name: '', email: '', phone: '', role: 'cashier', status: 'active', baseSalary: 0 });
                setIsEditingEmployee(true);
              }}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors"
            >
              <Plus size={20} className="mr-2" />
              Add Employee
            </button>
          </div>
          
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto custom-scrollbar">
            <table className="min-w-full divide-y divide-gray-800">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Role & Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Base Salary</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-gray-900 divide-y divide-gray-800">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-white">{emp.name}</div>
                      <div className="text-sm text-gray-400">Joined: {new Date(emp.joinDate).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      <div>{emp.email}</div>
                      <div>{emp.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="bg-blue-500/10 text-blue-500 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize">
                          {emp.role}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                          emp.status === 'active' ? 'bg-green-500/10 text-green-500' :
                          emp.status === 'leave' ? 'bg-yellow-500/10 text-yellow-500' :
                          'bg-red-500/10 text-red-500'
                        }`}>
                          {emp.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                      ${emp.baseSalary?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => {
                          setCurrentEmployee(emp);
                          setIsEditingEmployee(true);
                        }}
                        className="text-blue-400 hover:text-blue-300 p-2 transition-colors"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteEmployee(emp.id)}
                        className="text-red-400 hover:text-red-300 p-2 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : activeTab === 'attendance' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 col-span-1 h-fit">
            <h2 className="text-lg font-medium text-white mb-4">Record Attendance</h2>
            <form onSubmit={handleSaveAttendance} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300">Employee</label>
                <select
                  required
                  value={selectedEmployeeId}
                  onChange={e => setSelectedEmployeeId(e.target.value)}
                  className="mt-1 block w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                >
                  <option value="">Select Employee</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Date</label>
                <input
                  type="date"
                  required
                  value={attendanceForm.date}
                  onChange={e => setAttendanceForm({...attendanceForm, date: e.target.value})}
                  className="mt-1 block w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Status</label>
                <select
                  required
                  value={attendanceForm.status}
                  onChange={e => setAttendanceForm({...attendanceForm, status: e.target.value})}
                  className="mt-1 block w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="half-day">Half-day</option>
                  <option value="late">Late</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={attendanceForm.notes}
                  onChange={e => setAttendanceForm({...attendanceForm, notes: e.target.value})}
                  className="mt-1 block w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={!selectedEmployeeId}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Log Attendance
              </button>
            </form>
          </div>
          
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto custom-scrollbar col-span-1 md:col-span-2">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-800/50">
               <h2 className="text-lg font-medium text-white">Recent Attendance</h2>
               {selectedEmployeeId && (
                 <span className="text-sm text-gray-400">
                   Showing records for: <strong className="text-white">{employees.find(e => e.id === selectedEmployeeId)?.name}</strong>
                 </span>
               )}
            </div>
            <table className="min-w-full divide-y divide-gray-800">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Notes</th>
                </tr>
              </thead>
              <tbody className="bg-gray-900 divide-y divide-gray-800">
                {attendanceRecords.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-gray-500">No attendance records found.</td>
                  </tr>
                ) : (
                  attendanceRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {new Date(record.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                          record.status === 'present' ? 'bg-green-500/10 text-green-500' :
                          record.status === 'absent' ? 'bg-red-500/10 text-red-500' :
                          'bg-yellow-500/10 text-yellow-500'
                        }`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {record.notes || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 col-span-1 h-fit">
            <h2 className="text-lg font-medium text-white mb-4">Record Payment</h2>
            <form onSubmit={handleSaveSalary} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300">Employee</label>
                <select
                  required
                  value={selectedEmployeeId}
                  onChange={e => {
                    setSelectedEmployeeId(e.target.value);
                    const emp = employees.find(emp => emp.id === e.target.value);
                    if (emp) {
                      setSalaryForm({ ...salaryForm, amount: emp.baseSalary || 0 });
                    }
                  }}
                  className="mt-1 block w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                >
                  <option value="">Select Employee</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Payment Date</label>
                <input
                  type="date"
                  required
                  value={salaryForm.paymentDate}
                  onChange={e => setSalaryForm({...salaryForm, paymentDate: e.target.value})}
                  className="mt-1 block w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Base Amount ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={salaryForm.amount}
                  onChange={e => setSalaryForm({...salaryForm, amount: parseFloat(e.target.value)})}
                  className="mt-1 block w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300">Bonus ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={salaryForm.bonus}
                    onChange={e => setSalaryForm({...salaryForm, bonus: parseFloat(e.target.value)})}
                    className="mt-1 block w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300">Deduction ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={salaryForm.deduction}
                    onChange={e => setSalaryForm({...salaryForm, deduction: parseFloat(e.target.value)})}
                    className="mt-1 block w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-800 flex justify-between items-center">
                <span className="text-gray-300">Net Total:</span>
                <span className="text-xl font-bold text-white">
                  ${((salaryForm.amount || 0) + (salaryForm.bonus || 0) - (salaryForm.deduction || 0)).toFixed(2)}
                </span>
              </div>

              <button
                type="submit"
                disabled={!selectedEmployeeId}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Record Payment
              </button>
            </form>
          </div>
          
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto custom-scrollbar col-span-1 md:col-span-2">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-800/50">
               <h2 className="text-lg font-medium text-white">Salary History</h2>
               {selectedEmployeeId && (
                 <span className="text-sm text-gray-400">
                   Showing records for: <strong className="text-white">{employees.find(e => e.id === selectedEmployeeId)?.name}</strong>
                 </span>
               )}
            </div>
            <table className="min-w-full divide-y divide-gray-800">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Base</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Adjustments</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Net Paid</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-gray-900 divide-y divide-gray-800">
                {salaryRecords.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No salary records found.</td>
                  </tr>
                ) : (
                  salaryRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {new Date(record.paymentDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        ${record.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="text-green-500 mr-2">+{record.bonus.toFixed(2)}</span>
                        <span className="text-red-500">-{record.deduction.toFixed(2)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-white">
                        ${(record.amount + record.bonus - record.deduction).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                          record.status === 'paid' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
                        }`}>
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Employee Modal */}
      {isEditingEmployee && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-4">
                {currentEmployee.id ? 'Edit Employee' : 'Add Employee'}
              </h2>
              <form onSubmit={handleSaveEmployee} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300">Name</label>
                  <input
                    type="text"
                    required
                    value={currentEmployee.name}
                    onChange={e => setCurrentEmployee({...currentEmployee, name: e.target.value})}
                    className="mt-1 block w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300">Email</label>
                  <input
                    type="email"
                    required
                    value={currentEmployee.email}
                    onChange={e => setCurrentEmployee({...currentEmployee, email: e.target.value})}
                    className="mt-1 block w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300">Phone</label>
                  <input
                    type="text"
                    value={currentEmployee.phone || ''}
                    onChange={e => setCurrentEmployee({...currentEmployee, phone: e.target.value})}
                    className="mt-1 block w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300">Role</label>
                    <select
                      value={currentEmployee.role}
                      onChange={e => setCurrentEmployee({...currentEmployee, role: e.target.value})}
                      className="mt-1 block w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    >
                      <option value="admin">Admin</option>
                      <option value="manager">Manager</option>
                      <option value="cashier">Cashier</option>
                      <option value="driver">Delivery Driver</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300">Status</label>
                    <select
                      value={currentEmployee.status}
                      onChange={e => setCurrentEmployee({...currentEmployee, status: e.target.value})}
                      className="mt-1 block w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="leave">On Leave</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300">Base Salary ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={currentEmployee.baseSalary}
                    onChange={e => setCurrentEmployee({...currentEmployee, baseSalary: parseFloat(e.target.value)})}
                    className="mt-1 block w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                </div>

                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-800">
                  <button
                    type="button"
                    onClick={() => setIsEditingEmployee(false)}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors"
                  >
                    Save Employee
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
