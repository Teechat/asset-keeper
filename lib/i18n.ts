export type Lang = "en" | "th";

export const translations = {
  en: {
    tabs: { upcoming: "⏰ Upcoming", all: "📋 All Assets", add: "➕ Add" },
    header: { assets: "assets" },
    upcoming: {
      empty: "No tasks due in 30 days!",
      emptySub: "ไม่มีรายการในช่วง 30 วันข้างหน้า",
      label: (n: number) => `Due in next 30 days — ${n} item${n !== 1 ? "s" : ""}`,
      addBtn: "➕ Add Asset",
    },
    all: {
      empty: "No assets yet.",
      addBtn: "➕ Add your first asset",
    },
    card: {
      overdue: (d: number) => `${d}d overdue ⚠️`,
      today: "Due today! ⚠️",
      tomorrow: "Tomorrow",
      days: (d: number) => `${d} days`,
      noReminder: "No reminder",
      markDone: "✅ Mark Done",
      confirm: "Confirm?",
      cancel: "Cancel",
      oneTime: "one-time",
    },
    form: {
      title: "Add new asset",
      subtitle: "เพิ่มรายการบำรุงรักษาใหม่",
      step1: "Category",
      step2: (cat: string) => `Which ${cat.toLowerCase()}? / เป็นของ...`,
      step2hint: (cat: string) =>
        `Optional — helps tell apart multiple ${cat === "Car" ? "cars" : cat === "Home" ? "homes" : "items"}`,
      step3: "Type of task",
      step4: "Task name",
      taskPlaceholder: "e.g. Front tyres – Bridgestone 195/55R16",
      autoFilled: "Auto-filled — edit to add more detail",
      dueDate: "Next due date *",
      repeat: "Repeat",
      notes: "Notes (optional)",
      notesPlaceholder: "e.g. Bridgestone 195/55R16, Policy #XYZ-123",
      save: "Save asset",
      saving: "Saving…",
      errName: "Asset name is required",
      errCategory: "Category is required",
      errDate: "Due date is required",
      errNetwork: "Network error. Please try again.",
      other: "✏️ Other",
      recurrence: {
        none: "One-time only",
        monthly: "Every month",
        "custom-3-months": "Every 3 months",
        "custom-6-months": "Every 6 months",
        yearly: "Every year",
        "custom-2-years": "Every 2 years",
      },
    },
    noAuth: {
      msg: "Open this page from LINE to access your dashboard.",
      hint: "Add the AssetKeeper LINE OA and type",
    },
    loading: "Loading AssetKeeper…",
  },
  th: {
    tabs: { upcoming: "⏰ กำลังจะมาถึง", all: "📋 สินทรัพย์ทั้งหมด", add: "➕ เพิ่ม" },
    header: { assets: "รายการ" },
    upcoming: {
      empty: "ไม่มีรายการในช่วง 30 วันข้างหน้า!",
      emptySub: "No tasks due in 30 days",
      label: (n: number) => `ครบกำหนดใน 30 วัน — ${n} รายการ`,
      addBtn: "➕ เพิ่มสินทรัพย์",
    },
    all: {
      empty: "ยังไม่มีสินทรัพย์",
      addBtn: "➕ เพิ่มสินทรัพย์แรกของคุณ",
    },
    card: {
      overdue: (d: number) => `เกินกำหนด ${d} วัน ⚠️`,
      today: "ครบกำหนดวันนี้! ⚠️",
      tomorrow: "พรุ่งนี้",
      days: (d: number) => `อีก ${d} วัน`,
      noReminder: "ไม่มีการแจ้งเตือน",
      markDone: "✅ เสร็จแล้ว",
      confirm: "ยืนยัน?",
      cancel: "ยกเลิก",
      oneTime: "ครั้งเดียว",
    },
    form: {
      title: "เพิ่มสินทรัพย์ใหม่",
      subtitle: "Add new maintenance item",
      step1: "หมวดหมู่",
      step2: (cat: string) =>
        `${cat === "Car" ? "รถยนต์" : cat === "Home" ? "บ้าน/คอนโด" : cat === "Health" ? "สมาชิก" : "รายการ"}คันไหน/หลังไหน?`,
      step2hint: (cat: string) =>
        `ไม่บังคับ — ช่วยแยกแยะ${cat === "Car" ? "รถ" : cat === "Home" ? "บ้าน" : "รายการ"}หลายชิ้น`,
      step3: "ประเภทงาน",
      step4: "ชื่องาน",
      taskPlaceholder: "เช่น ยางหน้า – บริดจสโตน 195/55R16",
      autoFilled: "กรอกอัตโนมัติ — แก้ไขเพื่อเพิ่มรายละเอียด",
      dueDate: "วันครบกำหนดถัดไป *",
      repeat: "ทำซ้ำ",
      notes: "หมายเหตุ (ไม่บังคับ)",
      notesPlaceholder: "เช่น บริดจสโตน 195/55R16, กรมธรรม์ #XYZ-123",
      save: "บันทึก",
      saving: "กำลังบันทึก…",
      errName: "กรุณาใส่ชื่อสินทรัพย์",
      errCategory: "กรุณาเลือกหมวดหมู่",
      errDate: "กรุณาเลือกวันครบกำหนด",
      errNetwork: "เกิดข้อผิดพลาด กรุณาลองอีกครั้ง",
      other: "✏️ อื่นๆ",
      recurrence: {
        none: "ครั้งเดียว",
        monthly: "ทุกเดือน",
        "custom-3-months": "ทุก 3 เดือน",
        "custom-6-months": "ทุก 6 เดือน",
        yearly: "ทุกปี",
        "custom-2-years": "ทุก 2 ปี",
      },
    },
    noAuth: {
      msg: "เปิดหน้านี้จาก LINE เพื่อเข้าถึงแดชบอร์ดของคุณ",
      hint: "เพิ่ม AssetKeeper LINE OA แล้วพิมพ์",
    },
    loading: "กำลังโหลด AssetKeeper…",
  },
} as const;

export const CATEGORY_LABELS: Record<Lang, Record<string, string>> = {
  en: {
    Car: "🚗 Car",
    Home: "🏠 Home",
    Health: "💊 Health",
    Finance: "💰 Finance",
    Insurance: "🛡️ Insurance",
    Custom: "✏️ Custom",
  },
  th: {
    Car: "🚗 รถยนต์",
    Home: "🏠 บ้าน/คอนโด",
    Health: "💊 สุขภาพ",
    Finance: "💰 การเงิน",
    Insurance: "🛡️ ประกัน",
    Custom: "✏️ กำหนดเอง",
  },
};

export const CATEGORY_NAMES: Record<Lang, Record<string, string>> = {
  en: { Car: "Car", Home: "Home", Health: "Health", Finance: "Finance", Insurance: "Insurance" },
  th: { Car: "รถยนต์", Home: "บ้าน/คอนโด", Health: "สุขภาพ", Finance: "การเงิน", Insurance: "ประกัน" },
};

export const SUBCATEGORIES: Record<Lang, Record<string, string[]>> = {
  en: {
    Car: ["Tyre change", "Oil change", "Car service", "Car insurance", "Car tax", "Battery", "Brake pads", "Air filter", "Car wash"],
    Home: ["AC cleaning", "Water heater", "Home insurance", "Pest control", "Plumbing check", "Electrical check", "Garden / lawn", "Roof inspection"],
    Health: ["Annual check-up", "Dental check-up", "Eye check-up", "Vaccination", "Prescription refill", "Blood test", "Physiotherapy"],
    Finance: ["Insurance premium", "Loan payment", "Subscription renewal", "Tax filing", "Investment review", "Credit card fee"],
    Insurance: ["Car insurance", "Home insurance", "Health insurance", "Life insurance", "Travel insurance", "Flood insurance"],
  },
  th: {
    Car: ["เปลี่ยนยาง", "เปลี่ยนน้ำมัน", "บริการรถยนต์", "ประกันรถ", "ภาษีรถ", "แบตเตอรี่", "ผ้าเบรก", "ไส้กรองอากาศ", "ล้างรถ"],
    Home: ["ล้างแอร์", "เครื่องทำน้ำอุ่น", "ประกันบ้าน", "กำจัดแมลง", "ตรวจระบบประปา", "ตรวจระบบไฟฟ้า", "สวน/สนาม", "ตรวจหลังคา"],
    Health: ["ตรวจสุขภาพประจำปี", "ตรวจฟัน", "ตรวจตา", "ฉีดวัคซีน", "รับยาประจำ", "ตรวจเลือด", "กายภาพบำบัด"],
    Finance: ["ค่าเบี้ยประกัน", "ชำระเงินกู้", "ต่ออายุสมาชิก", "ยื่นภาษี", "ทบทวนการลงทุน", "ค่าธรรมเนียมบัตรเครดิต"],
    Insurance: ["ประกันรถ", "ประกันบ้าน", "ประกันสุขภาพ", "ประกันชีวิต", "ประกันเดินทาง", "ประกันน้ำท่วม"],
  },
};
