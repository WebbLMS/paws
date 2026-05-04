-- CreateTable
CREATE TABLE "EnquiryNote" (
    "id" TEXT NOT NULL,
    "enquiryId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "author" TEXT NOT NULL DEFAULT 'Shelter team',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnquiryNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnquiryStatusEvent" (
    "id" TEXT NOT NULL,
    "enquiryId" TEXT NOT NULL,
    "fromStatus" "EnquiryStatus",
    "toStatus" "EnquiryStatus" NOT NULL,
    "actor" TEXT NOT NULL DEFAULT 'Shelter team',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnquiryStatusEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EnquiryNote_enquiryId_createdAt_idx" ON "EnquiryNote"("enquiryId", "createdAt");

-- CreateIndex
CREATE INDEX "EnquiryStatusEvent_enquiryId_createdAt_idx" ON "EnquiryStatusEvent"("enquiryId", "createdAt");

-- AddForeignKey
ALTER TABLE "EnquiryNote" ADD CONSTRAINT "EnquiryNote_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "AdoptionEnquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnquiryStatusEvent" ADD CONSTRAINT "EnquiryStatusEvent_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "AdoptionEnquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
