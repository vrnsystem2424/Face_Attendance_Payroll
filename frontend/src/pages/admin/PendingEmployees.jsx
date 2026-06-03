import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEmployees, approveEmployee, rejectEmployee } from '../redux/slices/employeeSlice';
import API from '../api/axios';

const PendingEmployees = () => {
  const dispatch = useDispatch();
  const { employees, loading } = useSelector((state) => state.employees);

  // 🆕 Approve Modal State
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [managers, setManagers] = useState([]);
  const [selectedManagerId, setSelectedManagerId] = useState('');
  const [loadingManagers, setLoadingManagers] = useState(false);

  useEffect(() => {
    dispatch(fetchEmployees('pending'));
  }, [dispatch]);

  // 🆕 Open Approve Modal — Fetch managers
  const openApproveModal = async (employee) => {
    setSelectedEmployee(employee);
    setSelectedManagerId('');
    setShowApproveModal(true);

    try {
      setLoadingManagers(true);
      const response = await API.get('/employees/managers');
      setManagers(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch managers:', err);
      setManagers([]);
    } finally {
      setLoadingManagers(false);
    }
  };

  // 🆕 Confirm Approve
  const handleApproveConfirm = async () => {
    if (!selectedManagerId) {
      alert('Please select a manager');
      return;
    }

    const result = await dispatch(
      approveEmployee({
        id: selectedEmployee._id,
        data: {
          leave_approval_manager: selectedManagerId,  // ✅ ObjectId
        },
      })
    );

    if (result.meta.requestStatus === 'fulfilled') {
      setShowApproveModal(false);
      setSelectedEmployee(null);
      setSelectedManagerId('');
      dispatch(fetchEmployees('pending'));  // refresh
    }
  };

  const handleReject = (id) => {
    if (window.confirm('Reject this employee?')) {
      dispatch(rejectEmployee(id));
    }
  };

  return (
    <div className="p-6">
      <h2 className="mb-6 text-2xl font-bold">Pending Employees</h2>

      {loading ? (
        <p>Loading...</p>
      ) : employees.length === 0 ? (
        <p className="text-gray-500">No pending employees</p>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow">
          <table className="w-full">
            <thead className="bg-gray-50 text-left text-sm font-semibold text-gray-700">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Emp Code</th>
                <th className="p-4">Phone</th>
                <th className="p-4">Department</th>
                <th className="p-4">Company</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp._id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="p-4 font-medium">{emp.name}</td>
                  <td className="p-4 text-gray-600">{emp.emp_code}</td>
                  <td className="p-4 text-gray-600">{emp.phone}</td>
                  <td className="p-4 text-gray-600">{emp.department}</td>
                  <td className="p-4 text-gray-600">
                    {emp.company_id?.name || '-'}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openApproveModal(emp)}
                        className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(emp._id)}
                        className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 🆕 APPROVE MODAL */}
      {showApproveModal && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-900">Approve Employee</h3>
              <p className="mt-1 text-sm text-gray-500">
                Assign a leave approval manager for{' '}
                <span className="font-semibold text-gray-700">{selectedEmployee.name}</span>
              </p>
            </div>

            {/* Employee Info */}
            <div className="mb-5 rounded-xl bg-gray-50 p-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Emp Code</p>
                  <p className="font-semibold">{selectedEmployee.emp_code}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Department</p>
                  <p className="font-semibold">{selectedEmployee.department}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Designation</p>
                  <p className="font-semibold">{selectedEmployee.designation}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Company</p>
                  <p className="font-semibold">{selectedEmployee.company_id?.name || '-'}</p>
                </div>
              </div>
            </div>

            {/* Manager Dropdown */}
            <div className="mb-5">
              <label className="mb-2 block text-sm font-semibold text-gray-900">
                Select Leave Approval Manager <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedManagerId}
                onChange={(e) => setSelectedManagerId(e.target.value)}
                disabled={loadingManagers}
                className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 outline-none focus:border-orange-500 disabled:opacity-50"
              >
                <option value="">
                  {loadingManagers
                    ? 'Loading managers...'
                    : managers.length === 0
                    ? 'No managers available'
                    : 'Choose a manager'}
                </option>
                {managers.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name} ({m.emp_code}) {m.department && `— ${m.department}`}
                  </option>
                ))}
              </select>
              {managers.length === 0 && !loadingManagers && (
                <p className="mt-2 text-xs text-amber-600">
                  ⚠ No managers in this company yet. Create a manager/admin first.
                </p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowApproveModal(false);
                  setSelectedEmployee(null);
                  setSelectedManagerId('');
                }}
                className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveConfirm}
                disabled={!selectedManagerId}
                className="flex-1 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Confirm Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingEmployees;