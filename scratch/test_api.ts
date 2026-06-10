import "dotenv/config";
import { db } from "../server/db";
import { getTrendComparison } from "../src/controllers/statsController";

async function testController() {
  try {
    const users = await db.users.findMany();
    if (users.length === 0) {
      console.log("No user found in DB!");
      return;
    }
    const user = users[0];
    console.log("Found user:", user.email, "ID:", user.id);
    const goals = await db.goals.findMany({ user_id: user.id });
    const firstGoal = goals[0];

    for (const period of ["day", "week", "month"]) {
      for (const goalId of [undefined, firstGoal?.id]) {
        let statusCode = 0;
        let responseData: any = null;
        const req: any = {
          user: { id: user.id },
          query: goalId ? { period, goalId } : { period },
        };
        const res: any = {
          setHeader: () => res,
          status: (code: number) => {
            statusCode = code;
            return res;
          },
          json: (data: any) => {
            responseData = data;
            return res;
          },
        };
        const next = (err: any) => {
          if (err) throw err;
        };

        await getTrendComparison(req, res, next);
        console.log(
          `period=${period} goal=${goalId ? "filtered" : "all"} status=${statusCode} data=${responseData?.data?.length} current=${responseData?.currentTotal} previous=${responseData?.previousTotal}`
        );
      }
    }
  } catch (err: any) {
    console.error("Test execution failed:", err);
  }
}

testController();
