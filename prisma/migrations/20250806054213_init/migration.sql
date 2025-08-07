-- CreateTable
CREATE TABLE "public"."DailySnapshot" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subwayStatus" TEXT NOT NULL,
    "airQuality" TEXT NOT NULL,
    "eventInfo" TEXT NOT NULL,
    "userNote" TEXT,

    CONSTRAINT "DailySnapshot_pkey" PRIMARY KEY ("id")
);
