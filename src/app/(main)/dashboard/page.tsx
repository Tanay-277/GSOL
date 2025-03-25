import { authOptions } from "@/app/api/auth/[...nextauth]/auth";
import { getDashboardData } from "@/features/dashboard/actions/get-dashboard-data";
import { DashboardClient } from "@/features/dashboard/dashboard";
import { getServerSession } from "next-auth";

const Dashboard = async () => {
  const session = await getServerSession(authOptions);

  const data = await getDashboardData(session?.user?.id as string);

  return <DashboardClient data={data} />;
};

export default Dashboard;
