import oxc from "oxc-parser";
import { generateDepthInterfaces, generateInterfacePropertyReport } from "@/index.ts";
import { projectDepth, type DepthQuery } from "./export/payload-depth-types.ts";
import { assertEquals } from "@std/assert/equals";

const run = async () => {
  const filename = "./sample/payload-types.ts";
  const code = await Deno.readTextFile(filename);
  const result = oxc.parseSync(filename, code);

  if (result.errors && result.errors.length > 0) {
    console.error("Parse errors:", result.errors);
  }

  const report = generateInterfacePropertyReport(result.program);
  await Deno.writeTextFile(
    "./export/output.json",
    JSON.stringify(report, null, 2),
  );

  // Generate depth-based interfaces (default depth = 2) for types referenced in Config.collections only
  const depthTypes = generateDepthInterfaces(result.program, 2, {});
  Deno.writeTextFileSync(
    "./export/payload-depth-types.ts",
    `// Auto-generated. Do not edit.\n${depthTypes}`,
  );

  const d2 = {
"createdAt": "2025-07-11T11:09:35.676Z",
"updatedAt": "2025-08-28T06:33:49.485Z",
"tenant": {
"createdAt": "2025-05-28T11:20:42.673Z",
"updatedAt": "2025-05-28T11:20:42.673Z",
"name": "Tenant 1",
"domain": "gold.localhost",
"slug": "gold",
"allowPublicRead": false,
"id": "6836f18a2fd9a553e6890312"
},
"streak": {
"startDate": "2025-08-28T03:06:18.574Z",
"lastCountedDate": "2025-08-28T03:06:18.574Z",
"lastUpdateDate": "2025-08-28T03:06:18.574Z",
"currentStreak": 1,
"longestStreak": 2
},
"level": {
"exp": 1034
},
"ownedBy": {
"createdAt": "2025-05-28T11:20:43.983Z",
"updatedAt": "2025-08-27T12:58:54.473Z",
"username": "multi-admin",
"nickname": "MultiAdmin",
"firstName": "MultiTenant",
"lastName": "Admin",
"tenants": [
{
"tenant": {
"createdAt": "2025-05-28T11:20:43.031Z",
"updatedAt": "2025-05-28T11:20:43.031Z",
"name": "Tenant 2",
"domain": "silver.localhost",
"slug": "silver",
"allowPublicRead": false,
"id": "6836f18b2fd9a553e6890323"
},
"roles": [
"admin",
"caregiver",
"care-recipient"
],
"assignedCaregivers": [],
"isRecipientEnhanced": false,
"isDefaultGalleryMediaAssignee": false,
"id": "68af010e3ecf58482847af27"
},
{
"tenant": {
"createdAt": "2025-05-28T11:20:42.673Z",
"updatedAt": "2025-05-28T11:20:42.673Z",
"name": "Tenant 1",
"domain": "gold.localhost",
"slug": "gold",
"allowPublicRead": false,
"id": "6836f18a2fd9a553e6890312"
},
"roles": [
"admin",
"caregiver",
"care-recipient"
],
"assignedCaregivers": [],
"isRecipientEnhanced": true,
"isDefaultGalleryMediaAssignee": true,
"id": "68af010e3ecf58482847af28"
}
],
"roles": [
"user"
],
"email": "admin@gmail.com",
"avatar": {
"createdAt": "2025-05-31T12:35:23.472Z",
"updatedAt": "2025-08-27T12:58:57.064Z",
"tenant": "6836f18b2fd9a553e6890323",
"ownedBy": "6836f18b2fd9a553e6890382",
"filename": "86c1f7f6-762b-49aa-b15b-6a18fbb16f4b.jpg",
"mimeType": "image/jpeg",
"filesize": 227665,
"width": 1190,
"height": 1190,
"focalX": 50,
"focalY": 50,
"thumbnailURL": null,
"url": "https://swan-refresh-img.freemandev.dpdns.org/QtCx7q43ShfVSypp_twvVHbbPWoZX550KEpmRXKCRe4/exp:1756448630700/czM6Ly9wcml2YXRlLzg2YzFmN2Y2LTc2MmItNDlhYS1iMTViLTZhMThmYmIxNmY0Yi5qcGc",
"deletedAt": "2025-08-27T12:58:55.461Z",
"id": "683af78b16715ae9b3071243"
},
"note": "123",
"dateOfBirth": "2017-05-09T23:00:00.000Z",
"sessions": [
{
"id": "44727283-059b-4a0b-9c07-e68cdb34c083",
"createdAt": "2025-08-26T09:01:42.569Z",
"expiresAt": "2025-08-31T09:01:42.569Z"
},
{
"id": "35a12723-e42a-4df1-a7f7-18d6adaacc99",
"createdAt": "2025-08-27T05:40:18.657Z",
"expiresAt": "2025-09-01T05:40:18.657Z"
}
],
"id": "6836f18b2fd9a553e6890382"
},
"id": "6870f0ef63d957afb9fe4678"
} satisfies DepthQuery<"game-profiles",2>
  const d1 = {
"createdAt": "2025-07-11T11:09:35.676Z",
"updatedAt": "2025-08-28T06:33:49.485Z",
"tenant": {
"createdAt": "2025-05-28T11:20:42.673Z",
"updatedAt": "2025-05-28T11:20:42.673Z",
"name": "Tenant 1",
"domain": "gold.localhost",
"slug": "gold",
"allowPublicRead": false,
"id": "6836f18a2fd9a553e6890312"
},
"streak": {
"startDate": "2025-08-28T03:06:18.574Z",
"lastCountedDate": "2025-08-28T03:06:18.574Z",
"lastUpdateDate": "2025-08-28T03:06:18.574Z",
"currentStreak": 1,
"longestStreak": 2
},
"level": {
"exp": 1034
},
"ownedBy": {
"createdAt": "2025-05-28T11:20:43.983Z",
"updatedAt": "2025-08-27T12:58:54.473Z",
"username": "multi-admin",
"nickname": "MultiAdmin",
"firstName": "MultiTenant",
"lastName": "Admin",
"tenants": [
{
"tenant": "6836f18b2fd9a553e6890323",
"roles": [
"admin",
"caregiver",
"care-recipient"
],
"assignedCaregivers": [],
"isRecipientEnhanced": false,
"isDefaultGalleryMediaAssignee": false,
"id": "68af010e3ecf58482847af27"
},
{
"tenant": "6836f18a2fd9a553e6890312",
"roles": [
"admin",
"caregiver",
"care-recipient"
],
"assignedCaregivers": [],
"isRecipientEnhanced": true,
"isDefaultGalleryMediaAssignee": true,
"id": "68af010e3ecf58482847af28"
}
],
"roles": [
"user"
],
"email": "admin@gmail.com",
"avatar": "683af78b16715ae9b3071243",
"note": "123",
"dateOfBirth": "2017-05-09T23:00:00.000Z",
"sessions": [
{
"id": "44727283-059b-4a0b-9c07-e68cdb34c083",
"createdAt": "2025-08-26T09:01:42.569Z",
"expiresAt": "2025-08-31T09:01:42.569Z"
},
{
"id": "35a12723-e42a-4df1-a7f7-18d6adaacc99",
"createdAt": "2025-08-27T05:40:18.657Z",
"expiresAt": "2025-09-01T05:40:18.657Z"
}
],
"id": "6836f18b2fd9a553e6890382"
},
"id": "6870f0ef63d957afb9fe4678"
} satisfies DepthQuery<"game-profiles",1>
const d0 = {
"createdAt": "2025-07-11T11:09:35.676Z",
"updatedAt": "2025-08-28T06:33:49.485Z",
"tenant": "6836f18a2fd9a553e6890312",
"streak": {
"startDate": "2025-08-28T03:06:18.574Z",
"lastCountedDate": "2025-08-28T03:06:18.574Z",
"lastUpdateDate": "2025-08-28T03:06:18.574Z",
"currentStreak": 1,
"longestStreak": 2
},
"level": {
"exp": 1034
},
"ownedBy": "6836f18b2fd9a553e6890382",
"id": "6870f0ef63d957afb9fe4678"
} satisfies DepthQuery<"game-profiles",0>
  const a = projectDepth(d2,"game-profiles", 2, 1);

assertEquals(a, d1)
};

if (import.meta.main) {
  run();
}
