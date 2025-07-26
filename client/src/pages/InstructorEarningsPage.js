import React, { useState, useEffect } from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import apiUrl from '../apiConfig';
import useResponsive from '../hooks/useResponsive';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function InstructorEarningsPage() {
  const [earningsData, setEarningsData] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [pendingPayments, setPendingPayments] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [activeTab, setActiveTab] = useState('dashboard');
  const { isMobile, getSpacing, getTextSize } = useResponsive();

  useEffect(() => {
    fetchEarningsData();
  }, [selectedPeriod]);

  const fetchEarningsData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const [dashboardResponse, analyticsResponse, pendingResponse] = await Promise.all([
        fetch(`${apiUrl}/api/earnings/dashboard?period=${selectedPeriod}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${apiUrl}/api/earnings/analytics`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${apiUrl}/api/earnings/pending`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const [dashboardData, analyticsData, pendingData] = await Promise.all([
        dashboardResponse.json(),
        analyticsResponse.json(),
        pendingResponse.json()
      ]);

      setEarningsData(dashboardData);
      setAnalyticsData(analyticsData);
      setPendingPayments(pendingData);
    } catch (error) {
      console.error('Error fetching earnings data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Chart configurations
  const dailyEarningsChartData = earningsData?.dailyEarnings ? {
    labels: earningsData.dailyEarnings.map(item => 
      new Date(item.lesson_date).toLocaleDateString('en-IN', { 
        month: 'short', 
        day: 'numeric' 
      })
    ).reverse(),
    datasets: [
      {
        label: 'Daily Earnings',
        data: earningsData.dailyEarnings.map(item => item.daily_earnings).reverse(),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  } : null;

  const monthlyEarningsChartData = earningsData?.monthlyComparison ? {
    labels: earningsData.monthlyComparison.map(item => 
      new Date(item.month).toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: 'short' 
      })
    ).reverse(),
    datasets: [
      {
        label: 'Monthly Earnings',
        data: earningsData.monthlyComparison.map(item => item.earnings).reverse(),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1
      }
    ]
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '₹' + value.toLocaleString();
          }
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={getSpacing()}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className={`${getTextSize('text-xl', 'text-2xl', 'text-3xl')} font-bold mb-2`}>
            Earnings Dashboard
          </h1>
          <p className="text-gray-600">Track your teaching income and analytics</p>
        </div>
        
        {/* Period Selector */}
        <div className="flex space-x-2">
          {['week', 'month', 'year'].map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                selectedPeriod === period
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      {earningsData?.summary && (
        <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-4'} gap-4 mb-6`}>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(earningsData.summary.total_net_earnings)}
            </div>
            <div className="text-sm text-gray-600">Net Earnings</div>
            <div className="text-xs text-gray-500 mt-1">
              This {selectedPeriod}
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">
              {earningsData.summary.total_lessons}
            </div>
            <div className="text-sm text-gray-600">Lessons Taught</div>
            <div className="text-xs text-gray-500 mt-1">
              This {selectedPeriod}
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(earningsData.summary.avg_earning_per_lesson)}
            </div>
            <div className="text-sm text-gray-600">Avg per Lesson</div>
            <div className="text-xs text-gray-500 mt-1">
              This {selectedPeriod}
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(earningsData.summary.total_fees)}
            </div>
            <div className="text-sm text-gray-600">Platform Fees</div>
            <div className="text-xs text-gray-500 mt-1">
              This {selectedPeriod}
            </div>
          </div>
        </div>
      )}

      {/* Pending Payments Alert */}
      {pendingPayments?.totalPending > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="text-yellow-800">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Pending Payments: {formatCurrency(pendingPayments.totalPending)}
              </h3>
              <p className="text-sm text-yellow-700">
                You have {pendingPayments.pendingPayments.length} lessons awaiting payment processing.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} border-b`}>
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'analytics', label: 'Analytics' },
            { id: 'transactions', label: 'Transactions' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${isMobile ? 'w-full' : ''} px-4 py-2 font-medium ${
                activeTab === tab.id 
                  ? 'border-b-2 border-blue-500 text-blue-600' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Charts */}
          <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-6`}>
            {/* Daily Earnings Chart */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Daily Earnings Trend</h3>
              <div style={{ height: '300px' }}>
                {dailyEarningsChartData && (
                  <Line data={dailyEarningsChartData} options={chartOptions} />
                )}
              </div>
            </div>

            {/* Monthly Comparison Chart */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Monthly Comparison</h3>
              <div style={{ height: '300px' }}>
                {monthlyEarningsChartData && (
                  <Bar data={monthlyEarningsChartData} options={chartOptions} />
                )}
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Date</th>
                      <th className="text-left py-2">Student</th>
                      <th className="text-left py-2">Amount</th>
                      <th className="text-left py-2">Net Earnings</th>
                      <th className="text-left py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {earningsData?.recentTransactions?.map((transaction) => (
                      <tr key={transaction.id} className="border-b">
                        <td className="py-2">
                          {new Date(transaction.lesson_date).toLocaleDateString()}
                        </td>
                        <td className="py-2">{transaction.student_name}</td>
                        <td className="py-2">{formatCurrency(transaction.amount_earned)}</td>
                        <td className="py-2 font-medium text-green-600">
                          {formatCurrency(transaction.net_earnings)}
                        </td>
                        <td className="py-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            transaction.payment_status === 'paid' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {transaction.payment_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && analyticsData && (
        <div className="space-y-6">
          {/* Peak Hours Analysis */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Peak Teaching Hours</h3>
            <div className="space-y-3">
              {analyticsData.analytics.peakHours.map((hour, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div>
                    <div className="font-medium">{hour.time_slot}</div>
                    <div className="text-sm text-gray-600">
                      {hour.lesson_count} lessons
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-blue-600">
                      {formatCurrency(hour.avg_earnings)}
                    </div>
                    <div className="text-xs text-gray-500">avg per lesson</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Students */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Top Students</h3>
            <div className="space-y-3">
              {analyticsData.analytics.topStudents.map((student, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div>
                    <div className="font-medium">{student.student_name}</div>
                    <div className="text-sm text-gray-600">
                      {student.lessons_taken} lessons • {formatCurrency(student.total_paid)} total
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    {new Date(student.first_lesson).toLocaleDateString()} - {new Date(student.last_lesson).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Payment Methods</h3>
            <div className="space-y-3">
              {analyticsData.analytics.paymentMethods.map((method, index) => (
                <div key={index} className="flex items-center justify-between py-2">
                  <div className="font-medium">{method.payment_method}</div>
                  <div className="text-right">
                    <div className="font-bold">{method.transaction_count} transactions</div>
                    <div className="text-sm text-gray-600">
                      {formatCurrency(method.total_earnings)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">All Transactions</h3>
              <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
                Download Report
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3">Date</th>
                    <th className="text-left py-3">Student</th>
                    <th className="text-left py-3">Session</th>
                    <th className="text-left py-3">Amount</th>
                    <th className="text-left py-3">Platform Fee</th>
                    <th className="text-left py-3">Net Earnings</th>
                    <th className="text-left py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {earningsData?.recentTransactions?.map((transaction) => (
                    <tr key={transaction.id} className="border-b hover:bg-gray-50">
                      <td className="py-3">
                        {new Date(transaction.lesson_date).toLocaleDateString()}
                      </td>
                      <td className="py-3">
                        <div>
                          <div className="font-medium">{transaction.student_name}</div>
                          <div className="text-sm text-gray-500">{transaction.student_email}</div>
                        </div>
                      </td>
                      <td className="py-3">Driving Lesson</td>
                      <td className="py-3">{formatCurrency(transaction.amount_earned)}</td>
                      <td className="py-3 text-red-600">{formatCurrency(transaction.platform_fee)}</td>
                      <td className="py-3 font-medium text-green-600">
                        {formatCurrency(transaction.net_earnings)}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          transaction.payment_status === 'paid' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {transaction.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InstructorEarningsPage;