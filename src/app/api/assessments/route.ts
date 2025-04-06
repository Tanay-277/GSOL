import { authOptions } from "@/app/api/auth/[...nextauth]/auth";
import { db } from "@/db";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

// GET handler to retrieve assessments for the current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const assessments = await db.assessment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(assessments);
  } catch (error) {
    console.error("Error fetching assessments:", error);
    return NextResponse.json({ error: "Failed to fetch assessments" }, { status: 500 });
  }
}

// POST handler to store a new assessment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { responses, result, issues } = body;

    if (!responses || !result || !issues) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const assessment = await db.assessment.create({
      data: {
        userId: user.id,
        responses,
        result,
        issues,
      },
    });

    return NextResponse.json(assessment);
  } catch (error) {
    console.error("Error creating assessment:", error);
    return NextResponse.json({ error: "Failed to create assessment" }, { status: 500 });
  }
}
