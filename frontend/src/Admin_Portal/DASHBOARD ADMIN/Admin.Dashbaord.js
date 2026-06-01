import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import {
  getAdminDashboardSummary,
  deriveAdminMetrics,
  deriveAdminChartData,
  deriveAdminPendingWorks,
} from '../../services/adminDashboardService';

const ADMIN_BASE = '/admin';
const adminPath = (path = '') => (path ? `${ADMIN_BASE}/${path}` : ADMIN_BASE);

const Dashboard = () => {
    const [metrics, setMetrics] = useState({
        bookings: 0,
        pending: 0,
        failed: 0,
        revenue: 'INR 0',
        lastLoginIp: '--',
        lastLogin: '--',
        revenueToday: 'INR 0',
        revenueGrowth: '0%',
        b2cSuccessful: 0,
        successfulGrowth: '0%',
        failedBookings: 0,
        pendingWorks: 0,
        pendingAmount: 'INR 0',
        pendingGrowth: '0%',
    });

    const [chartData, setChartData] = useState({
        successful: [0, 0, 0, 0, 0, 0, 0],
        failed: [0, 0, 0, 0, 0, 0, 0],
        pending: [0, 0, 0, 0, 0, 0, 0],
    });

    const [chartLabels, setChartLabels] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
    const [pendingWorksList, setPendingWorksList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const maxValue = Math.max(1, ...chartData.successful, ...chartData.failed, ...chartData.pending);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setIsLoading(true);
        setError('');

        try {
            console.log('Fetching admin dashboard summary...');
            
            // Fetch summary once and derive all other data from it
            const summaryResult = await getAdminDashboardSummary().catch((err) => {
                console.error('Failed to fetch dashboard summary:', err.message);
                throw err;
            });

            console.log('Dashboard summary received:', summaryResult);

            // Derive metrics from summary
            const metricsResult = deriveAdminMetrics(summaryResult);
            console.log('Derived metrics:', metricsResult);

            // Derive chart data from summary
            const chartDataResult = deriveAdminChartData(summaryResult);
            console.log('Derived chart data:', chartDataResult);

            // Derive pending works from summary
            const pendingWorksResult = deriveAdminPendingWorks(summaryResult);
            console.log('Derived pending works:', pendingWorksResult);

            if (metricsResult) {
                setMetrics((prev) => ({
                    ...prev,
                    bookings: metricsResult.totalBookings || metricsResult.bookings || prev.bookings,
                    pending: metricsResult.pendingBookings || metricsResult.pending || prev.pending,
                    failed: metricsResult.failedBookings || metricsResult.failed || prev.failed,
                    revenue: formatCurrency(metricsResult.revenue || metricsResult.totalRevenue || 0),
                    lastLoginIp: metricsResult.lastLoginIp || metricsResult.lastLoginIP || prev.lastLoginIp,
                    lastLogin: formatDate(metricsResult.lastLoginAt || metricsResult.lastLogin) || prev.lastLogin,
                    revenueToday: formatCurrency(metricsResult.revenueToday || metricsResult.todayRevenue || 0),
                    revenueGrowth: formatPercent(metricsResult.revenueGrowth || metricsResult.revenueGrowthPercent || 0),
                    b2cSuccessful: metricsResult.b2cSuccessfulBookings || metricsResult.successfulBookings || prev.b2cSuccessful,
                    successfulGrowth: formatPercent(metricsResult.successfulGrowth || metricsResult.successfulGrowthPercent || 0),
                    failedBookings: metricsResult.failedBookings || prev.failedBookings,
                    pendingWorks: metricsResult.pendingWorks || metricsResult.pendingTasks || prev.pendingWorks,
                    pendingAmount: formatCurrency(metricsResult.pendingAmount || metricsResult.pendingTotal || 0),
                    pendingGrowth: formatPercent(metricsResult.pendingGrowth || metricsResult.pendingGrowthPercent || 0),
                }));
            }

            if (chartDataResult) {
                setChartData({
                    successful: chartDataResult.successful || chartDataResult.successfulBookings || chartDataResult.successfulData || [],
                    failed: chartDataResult.failed || chartDataResult.failedBookings || chartDataResult.failedData || [],
                    pending: chartDataResult.pending || chartDataResult.pendingBookings || chartDataResult.pendingData || [],
                });

                if (chartDataResult.labels || chartDataResult.dates || chartDataResult.days) {
                    setChartLabels(chartDataResult.labels || chartDataResult.dates || chartDataResult.days);
                }
            }

            if (pendingWorksResult) {
                const pendingItems = Array.isArray(pendingWorksResult)
                    ? pendingWorksResult
                    : pendingWorksResult.items || pendingWorksResult.list || [];

                setPendingWorksList(pendingItems);
            }
        } catch (err) {
            console.error('Dashboard fetch error:', err);
            setError(err.message || 'Unable to load dashboard data. Please check if the backend API is running.');
        } finally {
            setIsLoading(false);
        }
    };

    function formatCurrency(value) {
        const amount = Number(value) || 0;
        return `INR ${new Intl.NumberFormat('en-IN', {
            maximumFractionDigits: 0,
        }).format(amount)}`;
    }

    function formatPercent(value) {
        const num = Number(value) || 0;
        const sign = num >= 0 ? '+' : '';
        return `${sign}${num.toFixed(1)}%`;
    }

    function formatDate(value) {
        if (!value) return null;
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return null;
        return new Intl.DateTimeFormat('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    }

    return (
        <div className="dash-page" style={{ minWidth: 0, width: '100%' }}>
            {isLoading && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
                    <Loader2 size={32} className="spin" />
                    <span style={{ marginLeft: '12px' }}>Loading dashboard...</span>
                </div>
            )}

            {error && (
                <div style={{ padding: '16px', margin: '16px', backgroundColor: '#fde9eb', color: '#bc4051', borderRadius: '8px', border: '1px solid #f5c2c7' }}>
                    {error}
                </div>
            )}

            {!isLoading && (
                <>
                {/* Status Banner */}
                <section className="status-banner">
                    <div className="status-title">Today's Status :</div>
                    <div className="status-content">
                        <div className="status-stat">
                            <span className="status-dot dot-orange" />
                            <span className="status-label">
                                <strong>{metrics.bookings}</strong> Bookings
                            </span>
                        </div>
                        <div className="status-stat">
                            <span className="status-dot dot-green" />
                            <span className="status-label">
                                <strong>{metrics.pending}</strong> Pending
                            </span>
                        </div>
                        <div className="status-stat">
                            <span className="status-dot dot-orange" />
                            <span className="status-label">
                                <strong>{metrics.failed}</strong> Failed
                            </span>
                        </div>
                        <span className="status-sep" />
                        <div className="status-stat">
                            <span className="status-label">
                                <strong>{metrics.revenue}</strong> Revenue
                            </span>
                        </div>
                    </div>
                </section>

                {/* Info Cards Grid */}
                <section className="info-grid">
                    <div className="info-card">
                        <div className="info-icon blue">IP</div>
                        <div className="info-body">
                            <div className="info-title">Last Login IP</div>
                            <div className="info-value">{metrics.lastLoginIp}</div>
                            <div className="info-foot">
                                <span className="info-check" />
                                <span>Security verified</span>
                            </div>
                        </div>
                    </div>

                    <div className="info-card">
                        <div className="info-icon violet">LL</div>
                        <div className="info-body">
                            <div className="info-title">Last Login</div>
                            <div className="info-value">{metrics.lastLogin}</div>
                        </div>
                    </div>

                    <div className="info-card">
                        <div className="info-icon green">INR</div>
                        <div className="info-body">
                            <div className="info-title">Revenue Today</div>
                            <div className="info-value">{metrics.revenueToday}</div>
                            <div className="info-foot trend-up">{metrics.revenueGrowth} vs yesterday</div>
                        </div>
                    </div>
                </section>

                {/* Metric Cards Grid */}
                <section className="metric-grid">
                    {/* Successful Bookings Card */}
                    <div className="metric-card success">
                        <div className="metric-title">Today's B2C Successful Bookings</div>
                        <div className="metric-number">{metrics.b2cSuccessful}</div>
                        <div className="metric-growth">
                            <span className="trend-up">{metrics.successfulGrowth}</span> growth
                        </div>

                        {/* Bar Chart */}
                        <div className="metric-chart-container">
                            <div className="chart-bars-wrapper">
                                {chartData.successful.map((value, idx) => (
                                    <div key={idx} className="bar-container">
                                        <div
                                            className="chart-bar success-bar"
                                            style={{ height: `${(value / maxValue) * 100}%` }}
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="chart-labels-wrapper">
                                {chartLabels.map((label, idx) => (
                                    <div key={idx} className="chart-label">{label}</div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Failed Bookings Card */}
                    <div className="metric-card failed">
                        <div className="metric-title">B2C Failed Bookings</div>
                        <div className="metric-number">{metrics.failedBookings}</div>
                        <div className="metric-subtitle">API / Payment failures</div>

                        {/* Bar Chart */}
                        <div className="metric-chart-container">
                            <div className="chart-bars-wrapper">
                                {chartData.failed.map((value, idx) => (
                                    <div key={idx} className="bar-container">
                                        <div
                                            className="chart-bar failed-bar"
                                            style={{ height: `${(value / maxValue) * 100}%` }}
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="chart-labels-wrapper">
                                {chartLabels.map((label, idx) => (
                                    <div key={idx} className="chart-label">{label}</div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Pending Works Card */}
                    <div className="metric-card pending">
                        <div className="metric-title">Pending Works</div>
                        <div className="metric-number">{metrics.pendingWorks}</div>
                        <div className="metric-subtitle">Manual review required</div>

                        {/* Pending Works List */}
                        <div className="pending-list-container">
                            {pendingWorksList && pendingWorksList.length > 0 ? (
                                pendingWorksList.map((item, index) => (
                                    <div key={item.id || item.type || index} className="pending-item">
                                        <div className="pending-item-header">
                                            <span className="pending-icon">{item.icon || '📋'}</span>
                                            <span className="pending-item-title">{item.type || item.title || item.name || 'Pending Task'}</span>
                                        </div>
                                        <span className="pending-item-badge">{item.count || item.items || 0} items</span>
                                    </div>
                                ))
                            ) : (
                                <>
                                    <div className="pending-item">
                                        <div className="pending-item-header">
                                            <span className="pending-icon">📋</span>
                                            <span className="pending-item-title">Payment Review</span>
                                        </div>
                                        <span className="pending-item-badge">--</span>
                                    </div>
                                    <div className="pending-item">
                                        <div className="pending-item-header">
                                            <span className="pending-icon">🔍</span>
                                            <span className="pending-item-title">Booking Verification</span>
                                        </div>
                                        <span className="pending-item-badge">--</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </section>
                </>
            )}

                {/* Quick Actions */}
                <section className="quick-actions">
                    <h3>Quick Action Links</h3>
                    <div className="quick-grid">
                        <div className="quick-card">
                            <div className="quick-title">
                                <span className="quick-icon purple">CM</span>
                                <span>Customer Management</span>
                            </div>
                            <Link className="quick-item" to={adminPath('customer-management/customer-list')}>
                                <span>Customer List</span>
                                <span className="quick-arrow">&gt;</span>
                            </Link>
                            <Link className="quick-item" to={adminPath('customer-management/add-new-customer')}>
                                <span>Add Customer</span>
                                <span className="quick-arrow">&gt;</span>
                            </Link>
                        </div>

                        <div className="quick-card">
                            <div className="quick-title">
                                <span className="quick-icon orange">BUS</span>
                                <span>B2C Bus Management</span>
                            </div>
                            <Link className="quick-item" to={adminPath('b2c-bus/booking-list')}>
                                <span>Booking List</span>
                                <span className="quick-arrow">&gt;</span>
                            </Link>
                            <Link className="quick-item" to={adminPath('b2c-bus/cancellation-list')}>
                                <span>Cancellation List</span>
                                <span className="quick-arrow">&gt;</span>
                            </Link>
                        </div>
                    </div>
                </section>
        </div>
    );
};

export default Dashboard;
