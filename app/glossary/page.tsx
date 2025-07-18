/*
model Glossary {
  id          String   @id @default(cuid())
  name        String
  ordrer      Int      @default(1000)
  description String?
  type        String   @default("TERM") // TERM, ACRONYM, ABBREVIATION, CONCEPT, TEAM, PROJECT
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("glossary")
}
  */
/*
cete page doit Crud les termes du glossaire
   
*/
//@/app/glossary/page.tsx
import React from "react";

export default function page() {
  return <div>glossary page</div>;
}
