import { NextResponse } from "next/server";

export async function GET() {
  // 배포마다 고유한 ID 사용 (더 확실한 버전 구분)
  const BUILD_ID =
    process.env.VERCEL_DEPLOYMENT_ID || process.env.VERCEL_GIT_COMMIT_SHA;
  const BUILD_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0";

  const returnData = {
    version: BUILD_VERSION,
    buildId: BUILD_ID,
    deploymentId: process.env.VERCEL_DEPLOYMENT_ID || "local",
    commitSha: process.env.VERCEL_GIT_COMMIT_SHA || "unknown",
    timestamp: new Date().toISOString(),
  };

  console.log("versionData", returnData);
  return NextResponse.json(returnData);
}
