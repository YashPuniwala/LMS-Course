import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetDashboardMetricsQuery } from "@/features/api/purchaseApi";
import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const Dashboard = () => {
  const { data, isError, isLoading } = useGetDashboardMetricsQuery();
  console.log(data)
  if (isLoading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
  
  if (isError || !data) return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
      <p className="text-red-600">Error fetching dashboard metrics!</p>
    </div>
  );

  // Safely prepare data for charts with proper null checks
  const monthlyRevenueData = data?.data?.monthlyTrend?.map(item => ({
    name: item?.month || '',
    revenue: item?.revenue || 0,
    sales: item?.sales || 0,
    newStudents: item?.newStudents || 0
  })) || [];

  const categoryData = data?.data?.categories?.map(item => ({
    name: item?.category || 'Unknown',
    value: item?.revenue || 0
  })) || [];

  const topCourses = data?.data?.topCourses?.map(course => ({
    courseId: course?.courseId || '',
    title: course?.title || 'Unknown Course',
    revenue: course?.revenue || 0,
    enrollments: course?.enrollments || 0,
    avgDuration: course?.avgDuration || '0h 0m'
  })) || [];

  // Calculate student growth from monthly trend data
  const studentGrowth = monthlyRevenueData.map(item => ({
    month: item.name,
    newStudents: item.newStudents
  }));

  // Calculate active student percentage safely
  const activeStudentPercentage = data?.data?.totalStudents 
    ? Math.round((data?.data?.activeStudents / data?.data?.totalStudents) * 100)
    : 0;

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-800">
              ₹{(data?.data?.totalRevenue || 0).toLocaleString()}
            </div>
            <p className="text-xs text-blue-500 mt-1">All time earnings</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-800">
              {data?.data?.totalSales || 0}
            </div>
            <p className="text-xs text-green-500 mt-1">Total enrollments</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-600">Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-800">
              {(data?.data?.conversionRate || 0).toFixed(1)}%
            </div>
            <p className="text-xs text-purple-500 mt-1">Paid enrollments</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-600">Avg. Sale</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-800">
              ₹{(data?.data?.avgSaleValue || 0).toFixed(2)}
            </div>
            <p className="text-xs text-orange-500 mt-1">Per transaction</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts with proper empty state handling */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Monthly Performance Chart */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Monthly Performance</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {monthlyRevenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                  <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'Revenue') return [`₹${value}`, name];
                      return [value, name];
                    }}
                    contentStyle={{ borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}
                  />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    activeDot={{ r: 6 }}
                    name="Revenue"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="newStudents" 
                    stroke="#82ca9d" 
                    strokeWidth={2}
                    activeDot={{ r: 6 }}
                    name="New Students"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No monthly data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enrollment Types */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Enrollment Types</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <div className="flex items-center justify-center h-full">
              <div className="grid grid-cols-2 gap-4 w-full">
                <div className="flex flex-col items-center justify-center">
                  <div className="text-4xl font-bold text-blue-600">
                    {data?.data?.paidEnrollments || 0}
                  </div>
                  <div className="text-sm text-gray-500">Paid Enrollments</div>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <div className="text-4xl font-bold text-green-600">
                    {data?.data?.freeEnrollments || 0}
                  </div>
                  <div className="text-sm text-gray-500">Free Enrollments</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Charts Section */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Revenue by Category */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Revenue by Category</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`₹${value}`, "Revenue"]}
                    contentStyle={{ borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No category data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Courses */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Top Performing Courses</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {topCourses.length > 0 ? (
              <div className="space-y-4">
                {topCourses.map((course, index) => (
                  <div key={course.courseId} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-sm font-medium text-gray-500">{index + 1}.</div>
                      <div className="truncate max-w-[180px]">{course.title}</div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-sm font-medium">₹{course.revenue.toLocaleString()}</div>
                      <div className="text-sm text-gray-500">{course.enrollments} sales</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No top courses data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Content Metrics */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Total Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data?.data?.totalCourses || 0}</div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Total Lectures</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data?.data?.totalLectures || 0}</div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Avg. Course Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data?.data?.avgCourseDuration || '0h 0m'}</div>
          </CardContent>
        </Card>
      </div>

      {/* Student Metrics */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data?.data?.totalStudents || 0}</div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Active Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data?.data?.activeStudents || 0}</div>
            <p className="text-sm text-gray-500 mt-1">
              ({activeStudentPercentage}% of total)
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;