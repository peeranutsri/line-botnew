require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const line = require("@line/bot-sdk");
const fs = require("fs");
const path = require("path");
const moment = require("moment");
const logger = require("./config/logger") || {
  info: () => {},
  warn: () => {},
  error: () => {},
}; // Fallback
const { messages, quickReplyNavigation } = require("./utils/messageTemplates");
const User = require("./models/userSchema");
const Test = require("./models/testSchema");
const {
  GAD7_QUESTIONS,
  PSS_QUESTIONS,
  ACTIVITY_RECOMMENDATIONS,
} = require("./utils/activityRecommendations");
const {
  findNearbyHospitals,
  getTherapyRecommendation,
  getActivityLevel,
  getRecommendedActivity,
} = require("./utils/helpers");
const lineConfig = require("./config/lineConfig");

const app = express();
const client = new line.Client(lineConfig);

app.use(
  bodyParser.json({
    verify: (req, res, buf) => (req.rawBody = buf),
  }),
);

// Keep-Alive
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Server is running" });
});

// หน้าแรก
app.get("/", (req, res) => {
  res
    .status(200)
    .send(
      "สวัสดี! นี่คือเซิร์ฟเวอร์ MindEase Bot ใช้ /webhook สำหรับอีเวนต์จาก LINE",
    );
});

// ฟังก์ชันสร้างและเชื่อม Rich Menu
async function setupRichMenu() {
  try {
    const richMenus = await client.getRichMenuList().catch(() => []);
    const existingRichMenu = richMenus.find(
      (menu) => menu.chatBarText === "เมนูหลัก",
    );

    if (existingRichMenu) {
      logger.info("Rich Menu already exists, skipping creation.");
      return;
    }

    const richMenu = {
      size: { width: 2500, height: 1250 },
      selected: true,
      name: "MindEase Rich Menu",
      chatBarText: "เมนูหลัก",
      areas: [
        {
          bounds: { x: 0, y: 0, width: 1250, height: 625 },
          action: { type: "message", text: "แบบทดสอบ" },
        },
        {
          bounds: { x: 0, y: 625, width: 1250, height: 625 },
          action: { type: "message", text: "ความคืบหน้า" },
        },
        {
          bounds: { x: 1250, y: 0, width: 1250, height: 625 },
          action: { type: "message", text: "บันทึกอารมณ์" },
        },
        {
          bounds: { x: 1250, y: 625, width: 1250, height: 625 },
          action: { type: "message", text: "ฉุกเฉิน" },
        },
      ],
    };

    const richMenuId = await client.createRichMenu(richMenu);
    logger.info(`Rich Menu created with ID: ${richMenuId}`);

    const imagePath = path.join(__dirname, "richmenu.png");
    if (!fs.existsSync(imagePath)) {
      throw new Error("richmenu.png not found in project directory");
    }
    const imageStream = fs.createReadStream(imagePath);
    await client.setRichMenuImage(richMenuId, imageStream);
    logger.info("Rich Menu image uploaded successfully");

    await client.setDefaultRichMenu(richMenuId);
    logger.info("Rich Menu set as default for all users");
  } catch (error) {
    logger.error(`Error setting up Rich Menu: ${error.message}`);
  }
}

// เรียกใช้ฟังก์ชันสร้าง Rich Menu
setupRichMenu();

// Command Handler
async function handleCommand(event) {
  const userId = event.source.userId;
  const userMessage =
    event.message.type === "text" ? event.message.text.trim() : "";
  let user = await User.findOne({ userId });

  if (!user) {
    user = new User({
      userId,
      history: [],
      moodLogs: [],
      activities: [],
      hasConfirmedActivity: false,
    });
    await user.save();
    logger.info(`New user created: ${userId}`);

    try {
      const richMenus = await client.getRichMenuList();
      const richMenu = richMenus.find(
        (menu) => menu.chatBarText === "เมนูหลัก",
      );
      if (richMenu) {
        await client.linkRichMenuToUser(userId, richMenu.richMenuId);
        logger.info(`Rich Menu linked to user: ${userId}`);
      }
    } catch (error) {
      logger.error(
        `Error linking Rich Menu to user ${userId}: ${error.message}`,
      );
    }

    return messages.intro();
  }

  if (userMessage === "เมนูหลัก") {
    user.recommendedActivity = null;
    user.step = 1;
    user.currentActivityStep = 0;
    user.hasConfirmedActivity = false;
    await user.save();
    return messages.intro();
  }

  if (userMessage === "ช่วยเหลือ") return messages.help();
  if (userMessage === "ช่วยเหลือ_ทดสอบ") return messages.helpTest();
  if (userMessage === "ช่วยเหลือ_อารมณ์") return messages.helpMood();

  if (userMessage === "ฉุกเฉิน") {
    return [
      {
        type: "flex",
        altText: "เบอร์ฉุกเฉิน",
        contents: {
          type: "bubble",
          body: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "🚨 เบอร์ฉุกเฉิน",
                weight: "bold",
                size: "lg",
              },
              {
                type: "text",
                text: "กดเพื่อโทรได้ทันที:",
                wrap: true,
                size: "sm",
                margin: "md",
              },
              {
                type: "text",
                text: "📞 สายด่วนสุขภาพจิต: ",
                size: "sm",
                margin: "sm",
              },
              {
                type: "text",
                text: "1323",
                size: "sm",
                color: "#0000FF",
                action: { type: "uri", label: "1323", uri: "tel:1323" },
              },
              {
                type: "text",
                text: "📞 สายด่วนฉุกเฉิน: ",
                size: "sm",
                margin: "sm",
              },
              {
                type: "text",
                text: "1669",
                size: "sm",
                color: "#0000FF",
                action: { type: "uri", label: "1669", uri: "tel:1669" },
              },
            ],
            paddingAll: "lg",
          },
          footer: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "button",
                style: "primary",
                action: {
                  type: "message",
                  label: "ค้นหาโรงพยาบาล",
                  text: "ค้นหาโรงพยาบาล",
                },
              },
              {
                type: "button",
                style: "secondary",
                action: { type: "message", label: "กลับ", text: "เมนูหลัก" },
                margin: "sm",
              },
            ],
            paddingAll: "md",
          },
        },
      },
    ];
  }

  if (userMessage === "ค้นหาโรงพยาบาล") {
    return {
      type: "flex",
      altText: "ค้นหาโรงพยาบาล",
      contents: {
        type: "bubble",
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: "🏥 ค้นหาโรงพยาบาลใกล้เคียง",
              weight: "bold",
              size: "lg",
            },
            {
              type: "text",
              text: "กรุณาแชร์ตำแหน่งเพื่อค้นหาโรงพยาบาล",
              wrap: true,
              size: "sm",
              margin: "md",
            },
          ],
          paddingAll: "lg",
        },
        footer: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "button",
              style: "primary",
              action: {
                type: "uri",
                label: "แชร์ตำแหน่ง",
                uri: "line://nv/location",
              },
            },
            {
              type: "button",
              style: "secondary",
              action: { type: "message", label: "กลับ", text: "เมนูหลัก" },
              margin: "sm",
            },
          ],
          paddingAll: "md",
        },
      },
    };
  }

  if (event.message.type === "location") {
    const { latitude, longitude } = event.message;
    const hospitals = await findNearbyHospitals(latitude, longitude);

    if (!hospitals) {
      return {
        type: "flex",
        altText: "ไม่พบโรงพยาบาล",
        contents: {
          type: "bubble",
          body: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "🏥 ไม่พบโรงพยาบาลใกล้เคียง",
                weight: "bold",
                size: "lg",
              },
              {
                type: "text",
                text: "ขออภัย ไม่พบโรงพยาบาลในระยะ 5 กม. รอบตำแหน่งของคุณ",
                wrap: true,
                size: "sm",
                margin: "md",
              },
              {
                type: "text",
                text: "คุณสามารถลองแชร์ตำแหน่งใหม่อีกครั้ง หรือติดต่อสายด่วน 1669 เพื่อขอความช่วยเหลือทันที",
                wrap: true,
                size: "sm",
                margin: "sm",
              },
            ],
            paddingAll: "lg",
          },
          footer: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "button",
                style: "primary",
                action: {
                  type: "uri",
                  label: "โทร 1669",
                  uri: "tel:1669",
                },
              },
              {
                type: "button",
                style: "secondary",
                action: { type: "message", label: "กลับ", text: "เมนูหลัก" },
                margin: "sm",
              },
            ],
            paddingAll: "md",
          },
        },
      };
    }

    return {
      type: "flex",
      altText: "โรงพยาบาลใกล้เคียง",
      contents: {
        type: "carousel",
        contents: hospitals.map((hospital) => ({
          type: "bubble",
          body: {
            type: "box",
            layout: "vertical",
            spacing: "sm",
            contents: [
              {
                type: "text",
                text: hospital.name,
                weight: "bold",
                size: "lg",
                wrap: true,
              },
              {
                type: "text",
                text: hospital.address,
                wrap: true,
                size: "sm",
                color: "#666666",
              },
            ],
            paddingAll: "lg",
          },
          footer: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "button",
                style: "primary",
                action: {
                  type: "uri",
                  label: "ดูในแผนที่",
                  uri: hospital.url,
                },
              },
            ],
            paddingAll: "md",
          },
        })),
      },
    };
  }

  if (userMessage === "แบบทดสอบ") {
    user.step = 2;
    await user.save();
    return messages.testIntro();
  }

  if (userMessage === "เริ่มต้น" && user.step === 2) {
    user.step = 3;
    await user.save();
    return messages.testSelection();
  }

  if (userMessage === "แบบทดสอบGAD7") {
    const ongoingPSS = await Test.findOne({
      userId,
      testType: "PSS",
      isInProgress: true,
    });
    if (ongoingPSS) {
      ongoingPSS.isInProgress = false;
      await ongoingPSS.save();
    }

    user.step = 4;
    await user.save();
    const userTest = new Test({
      userId,
      testType: "GAD7",
      answers: [],
      score: 0,
    });
    await userTest.save();
    return messages.question(
      GAD7_QUESTIONS[0],
      "GAD7",
      1,
      GAD7_QUESTIONS.length,
    );
  }

  if (userMessage === "แบบทดสอบPSS") {
    const ongoingGAD7 = await Test.findOne({
      userId,
      testType: "GAD7",
      isInProgress: true,
    });
    if (ongoingGAD7) {
      ongoingGAD7.isInProgress = false;
      await ongoingGAD7.save();
    }

    user.step = 5;
    await user.save();
    const userTest = new Test({
      userId,
      testType: "PSS",
      answers: [],
      score: 0,
    });
    await userTest.save();
    return messages.question(PSS_QUESTIONS[0], "PSS", 1, PSS_QUESTIONS.length);
  }

  if (/^[0-4]$/.test(userMessage) && (user.step === 4 || user.step === 5)) {
    const testType = user.step === 4 ? "GAD7" : "PSS";
    let userTest = await Test.findOne({ userId, testType, isInProgress: true });

    if (!userTest) {
      userTest = new Test({ userId, testType, answers: [], score: 0 });
      await userTest.save();
    }

    const answer = parseInt(userMessage);
    const positiveQuestions = [4, 5, 7, 8];
    const questionIndex = userTest.answers.length + 1;

    const score =
      testType === "PSS" && positiveQuestions.includes(questionIndex)
        ? 4 - answer
        : answer;

    userTest.answers.push(score);
    const totalQuestions =
      testType === "GAD7" ? GAD7_QUESTIONS.length : PSS_QUESTIONS.length;

    if (questionIndex < totalQuestions) {
      await userTest.save();
      return messages.question(
        (testType === "GAD7" ? GAD7_QUESTIONS : PSS_QUESTIONS)[questionIndex],
        testType,
        questionIndex + 1,
        totalQuestions,
      );
    } else {
      userTest.score = userTest.answers.reduce((sum, val) => sum + val, 0);
      userTest.isInProgress = false;
      await userTest.save();

      user.history.push({
        testType,
        score: userTest.score,
        date: new Date(),
        liked: false,
        completed: true,
      });
      user.lastTestDate = new Date();
      user.step = 1;

      const level = getActivityLevel(testType, userTest.score);
      const activity = getRecommendedActivity(
        testType,
        level,
        user.history,
        ACTIVITY_RECOMMENDATIONS,
      );
      user.recommendedActivity = activity;
      user.activities.push({
        type: activity.name,
        interactive: activity.interactive,
        progress: 0,
        completed: false,
        liked: null,
        dateStarted: new Date(),
        currentStep: 0,
        goal: activity.goal || 0,
        maxSteps: activity.steps ? activity.steps.length : 0,
      });

      await user.save();
      logger.info(
        `User ${userId} - Test completed. Recommended Activity: ${JSON.stringify(activity)}`,
      );
      const therapyAdvice = getTherapyRecommendation(testType, userTest.score);
      return messages.testResult(
        testType,
        userTest.score,
        therapyAdvice,
        activity,
      );
    }
  }

  if (userMessage === "ตั้งเตือน7วัน") {
    const message = {
      type: "text",
      text: "ตั้งเตือนทุก 7 วันเรียบร้อยแล้ว! ระบบจะแจ้งเตือนคุณให้ทำแบบประเมินอีกครั้ง",
    };
    message.quickReply = quickReplyNavigation;
    return message;
  }

  if (userMessage === "ถูกใจกิจกรรม" && user.recommendedActivity) {
    logger.info(
      `User ${userId} - Entering ถูกใจกิจกรรม handler. Recommended Activity: ${JSON.stringify(user.recommendedActivity)}, hasConfirmedActivity: ${user.hasConfirmedActivity}`,
    );
    const currentActivity = user.activities.find(
      (a) => a.type === user.recommendedActivity.name && a.liked === null,
    );
    if (!currentActivity) {
      logger.warn(
        `User ${userId} - No matching activity found in ถูกใจกิจกรรม handler. Activities: ${JSON.stringify(user.activities)}`,
      );
      const message = {
        type: "text",
        text: "ขออภัย ไม่พบกิจกรรมที่กำลังดำเนินการ กรุณาทำแบบทดสอบใหม่เพื่อรับกิจกรรมค่ะ",
      };
      message.quickReply = quickReplyNavigation;
      return message;
    }

    if (!user.hasConfirmedActivity) {
      // Show confirmation message before starting the activity
      user.hasConfirmedActivity = true;
      currentActivity.liked = true;
      currentActivity.currentStep = 0; // Reset currentStep to ensure fresh start
      await user.save();
      logger.info(
        `User ${userId} - Confirmed liking activity. hasConfirmedActivity set to true. Updated user state: ${JSON.stringify(user)}`,
      );

      return {
        type: "flex",
        altText: "คุณเลือกถูกใจกิจกรรมนี้!",
        contents: {
          type: "bubble",
          body: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "🎉 คุณเลือกถูกใจกิจกรรมนี้!",
                weight: "bold",
                size: "lg",
              },
              {
                type: "text",
                text: `มาเริ่มทำ "${currentActivity.type}" ไปด้วยกันเลยค่ะ!`,
                wrap: true,
                size: "sm",
                margin: "md",
              },
              {
                type: "text",
                text: 'กด "เริ่มทำ" เพื่อเริ่มขั้นแรก',
                wrap: true,
                size: "xs",
                color: "#666666",
                margin: "sm",
              },
            ],
            paddingAll: "lg",
          },
          footer: {
            type: "box",
            layout: "vertical",
            spacing: "sm",
            contents: [
              {
                type: "button",
                style: "primary",
                color: "#4CAF50",
                action: {
                  type: "message",
                  label: "เริ่มทำ",
                  text: "เริ่มทำกิจกรรม",
                },
              },
              {
                type: "button",
                style: "secondary",
                action: {
                  type: "message",
                  label: "ยกเลิก",
                  text: "เมนูหลัก",
                },
              },
            ],
            paddingAll: "md",
          },
        },
      };
    }
  }

  if (userMessage === "เริ่มทำกิจกรรม") {
    logger.info(
      `User ${userId} - Entering เริ่มทำกิจกรรม handler. Recommended Activity: ${JSON.stringify(user.recommendedActivity)}, hasConfirmedActivity: ${user.hasConfirmedActivity}, Activities: ${JSON.stringify(user.activities)}`,
    );
    if (!user.recommendedActivity) {
      logger.warn(
        `User ${userId} - No recommended activity found in เริ่มทำกิจกรรม handler.`,
      );
      const message = {
        type: "text",
        text: "ขออภัย ไม่พบกิจกรรมที่กำลังดำเนินการ กรุณาทำแบบทดสอบใหม่เพื่อรับกิจกรรมค่ะ",
      };
      message.quickReply = quickReplyNavigation;
      return message;
    }

    const currentActivity = user.activities.find(
      (a) =>
        a.type === user.recommendedActivity.name &&
        a.liked === true &&
        !a.completed,
    );
    if (!currentActivity) {
      logger.warn(
        `User ${userId} - No matching activity found in เริ่มทำกิจกรรม handler. Activities: ${JSON.stringify(user.activities)}`,
      );
      const message = {
        type: "text",
        text: "ขออภัย ไม่พบกิจกรรมที่กำลังดำเนินการ กรุณาทำแบบทดสอบใหม่เพื่อรับกิจกรรมค่ะ",
      };
      message.quickReply = quickReplyNavigation;
      return message;
    }

    currentActivity.currentStep = 1;

    currentActivity.maxSteps = user.recommendedActivity.steps
      ? user.recommendedActivity.steps.length
      : 0;
    await user.save();
    logger.info(
      `User ${userId} - Reset currentStep to 1 and updated maxSteps to ${currentActivity.maxSteps}. Updated user state: ${JSON.stringify(user)}`,
    );

    const totalSteps = user.recommendedActivity.steps
      ? user.recommendedActivity.steps.length
      : 0;
    const stepIndex = currentActivity.currentStep - 1;

    logger.info(
      `User ${userId} - Starting activity. currentStep: ${currentActivity.currentStep}, totalSteps: ${totalSteps}`,
    );

    if (currentActivity.currentStep <= totalSteps) {
      const activityForPrompt = {
        name: user.recommendedActivity.name,
        steps: user.recommendedActivity.steps,
      };
      logger.info(
        `User ${userId} - Displaying step ${currentActivity.currentStep}/${totalSteps}: ${activityForPrompt.steps[stepIndex]}`,
      );
      return {
        type: "flex",
        altText: `กิจกรรม: ${activityForPrompt.name}`,
        contents: {
          type: "bubble",
          header: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: `ขั้นที่ ${currentActivity.currentStep}/${totalSteps}`,
                size: "sm",
                color: "#FFFFFF",
              },
            ],
            backgroundColor: "#4CAF50",
            paddingAll: "md",
          },
          body: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: activityForPrompt.name || "กิจกรรมไม่ระบุ",
                wrap: true,
                weight: "bold",
                size: "md",
              },
              {
                type: "text",
                text: `พร้อมสำหรับขั้นที่ ${currentActivity.currentStep}! ${activityForPrompt.steps && activityForPrompt.steps[stepIndex] ? activityForPrompt.steps[stepIndex] : "ไม่มีคำอธิบาย"}`,
                wrap: true,
                size: "sm",
                margin: "md",
              },
              {
                type: "text",
                text: 'กด "ทำขั้นต่อไป" เพื่อไปต่อ',
                wrap: true,
                size: "xs",
                color: "#666666",
                margin: "sm",
              },
            ],
            paddingAll: "lg",
          },
          footer: {
            type: "box",
            layout: "vertical",
            spacing: "sm",
            contents: [
              {
                type: "button",
                style: "primary",
                color: "#4CAF50",
                action: {
                  type: "message",
                  label: "ทำขั้นต่อไป",
                  text: `ทำขั้น_${currentActivity.currentStep + 1}`,
                },
              },
              {
                type: "button",
                style: "secondary",
                action: {
                  type: "message",
                  label: "หยุด",
                  text: "หยุดกิจกรรม",
                },
              },
            ],
            paddingAll: "md",
          },
        },
      };
    } else {
      currentActivity.completed = true;
      currentActivity.dateCompleted = new Date();
      user.history.push({
        testType: `Activity_${currentActivity.type}`,
        score: 0,
        date: new Date(),
        liked: true,
        completed: true,
      });
      user.recommendedActivity = null;
      user.currentActivityStep = 0;
      user.hasConfirmedActivity = false;
      await user.save();
      logger.info(
        `User ${userId} - Activity completed: ${currentActivity.type}`,
      );

      return {
        type: "flex",
        altText: "สำเร็จ: คุณทำกิจกรรมครบแล้ว!",
        contents: {
          type: "bubble",
          body: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "🎉 สุดยอด!",
                weight: "bold",
                size: "lg",
              },
              {
                type: "text",
                text: `คุณทำกิจกรรม "${currentActivity.type}" สำเร็จครบทุกขั้นแล้ว!`,
                wrap: true,
                size: "sm",
                margin: "md",
              },
              {
                type: "text",
                text: "อยากลองทำอะไรต่อดีคะ?",
                size: "sm",
                margin: "md",
              },
            ],
            paddingAll: "lg",
          },
          footer: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "button",
                style: "primary",
                color: "#4CAF50",
                action: {
                  type: "message",
                  label: "ทำแบบทดสอบใหม่",
                  text: "แบบทดสอบ",
                },
              },
              {
                type: "button",
                style: "secondary",
                action: {
                  type: "message",
                  label: "กลับเมนูหลัก",
                  text: "เมนูหลัก",
                },
                margin: "sm",
              },
            ],
            paddingAll: "md",
          },
        },
      };
    }
  }

  if (/^ทำขั้น_(\d+)$/.test(userMessage) && user.recommendedActivity) {
    logger.info(
      `User ${userId} - Entering ทำขั้น handler with message: ${userMessage}`,
    );
    const step = parseInt(userMessage.match(/^ทำขั้น_(\d+)$/)[1]);
    const currentActivity = user.activities.find(
      (a) => a.type === user.recommendedActivity.name && !a.completed,
    );

    if (!currentActivity) {
      logger.warn(
        `User ${userId} - No matching activity found in ทำขั้น handler. Activities: ${JSON.stringify(user.activities)}`,
      );
      const message = {
        type: "text",
        text: "ขออภัย ไม่พบกิจกรรมที่กำลังดำเนินการ กรุณาทำแบบทดสอบใหม่เพื่อรับกิจกรรมค่ะ",
      };
      message.quickReply = quickReplyNavigation;
      return message;
    }

    const totalSteps = user.recommendedActivity.steps
      ? user.recommendedActivity.steps.length
      : 0;
    if (step <= totalSteps) {
      currentActivity.currentStep = step;
      await user.save();
      const activityForPrompt = {
        name: user.recommendedActivity.name,
        steps: user.recommendedActivity.steps,
      };
      logger.info(
        `User ${userId} - Displaying step ${step}/${totalSteps}: ${activityForPrompt.steps[step - 1]}`,
      );
      return {
        type: "flex",
        altText: `กิจกรรม: ${activityForPrompt.name}`,
        contents: {
          type: "bubble",
          header: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: `ขั้นที่ ${step}/${totalSteps}`,
                size: "sm",
                color: "#FFFFFF",
              },
            ],
            backgroundColor: "#4CAF50",
            paddingAll: "md",
          },
          body: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: activityForPrompt.name || "กิจกรรมไม่ระบุ",
                wrap: true,
                weight: "bold",
                size: "md",
              },
              {
                type: "text",
                text: `พร้อมสำหรับขั้นที่ ${step}! ${activityForPrompt.steps && activityForPrompt.steps[step - 1] ? activityForPrompt.steps[step - 1] : "ไม่มีคำอธิบาย"}`,
                wrap: true,
                size: "sm",
                margin: "md",
              },
              {
                type: "text",
                text: 'กด "ทำขั้นต่อไป" เพื่อไปต่อ',
                wrap: true,
                size: "xs",
                color: "#666666",
                margin: "sm",
              },
            ],
            paddingAll: "lg",
          },
          footer: {
            type: "box",
            layout: "vertical",
            spacing: "sm",
            contents: [
              {
                type: "button",
                style: "primary",
                color: "#4CAF50",
                action: {
                  type: "message",
                  label: "ทำขั้นต่อไป",
                  text: `ทำขั้น_${step + 1}`,
                },
              },
              {
                type: "button",
                style: "secondary",
                action: {
                  type: "message",
                  label: "หยุด",
                  text: "หยุดกิจกรรม",
                },
              },
            ],
            paddingAll: "md",
          },
        },
      };
    } else {
      currentActivity.completed = true;
      currentActivity.dateCompleted = new Date();
      user.history.push({
        testType: `Activity_${currentActivity.type}`,
        score: 0,
        date: new Date(),
        liked: true,
        completed: true,
      });
      user.recommendedActivity = null;
      user.currentActivityStep = 0;
      user.hasConfirmedActivity = false;
      await user.save();
      logger.info(
        `User ${userId} - Activity completed: ${currentActivity.type}`,
      );

      return {
        type: "flex",
        altText: "สำเร็จ: คุณทำกิจกรรมครบแล้ว!",
        contents: {
          type: "bubble",
          body: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "🎉 สุดยอด!",
                weight: "bold",
                size: "lg",
              },
              {
                type: "text",
                text: `คุณทำกิจกรรม "${currentActivity.type}" สำเร็จครบทุกขั้นแล้ว!`,
                wrap: true,
                size: "sm",
                margin: "md",
              },
              {
                type: "text",
                text: "อยากลองทำอะไรต่อดีคะ?",
                size: "sm",
                margin: "md",
              },
            ],
            paddingAll: "lg",
          },
          footer: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "button",
                style: "primary",
                color: "#4CAF50",
                action: {
                  type: "message",
                  label: "ทำแบบทดสอบใหม่",
                  text: "แบบทดสอบ",
                },
              },
              {
                type: "button",
                style: "secondary",
                action: {
                  type: "message",
                  label: "กลับเมนูหลัก",
                  text: "เมนูหลัก",
                },
                margin: "sm",
              },
            ],
            paddingAll: "md",
          },
        },
      };
    }
  }

  if (userMessage === "หยุดกิจกรรม" && user.recommendedActivity) {
    logger.info(`User ${userId} - Stopping activity.`);
    const currentActivity = user.activities.find(
      (a) => a.type === user.recommendedActivity.name && !a.completed,
    );
    if (currentActivity) {
      currentActivity.progress =
        (currentActivity.currentStep / (currentActivity.maxSteps || 1)) * 100;
      user.recommendedActivity = null;
      user.currentActivityStep = 0;
      user.hasConfirmedActivity = false;
      await user.save();
      const message = {
        type: "text",
        text: "หยุดกิจกรรมเรียบร้อยแล้ว คุณสามารถกลับไปเมนูหลักหรือทำแบบทดสอบใหม่ได้ค่ะ",
      };
      message.quickReply = quickReplyNavigation;
      return message;
    }
  }

  if (userMessage === "ไม่ถูกใจกิจกรรม" && user.recommendedActivity) {
    logger.info(`User ${userId} - Disliking activity.`);
    const currentActivity = user.activities.find(
      (a) => a.type === user.recommendedActivity.name && a.liked === null,
    );
    if (currentActivity) {
      currentActivity.liked = false;
      currentActivity.completed = false;
      user.history.push({
        testType: `Activity_${currentActivity.type}`,
        score: 0,
        date: new Date(),
        liked: false,
        completed: false,
      });

      const latestTest = user.history.find((h) =>
        ["GAD7", "PSS"].includes(h.testType),
      );
      const level = latestTest
        ? getActivityLevel(latestTest.testType, latestTest.score)
        : "low";
      const newActivity = getRecommendedActivity(
        latestTest?.testType || "GAD7",
        level,
        user.history,
        ACTIVITY_RECOMMENDATIONS,
      );

      if (newActivity.name === currentActivity.type) {
        const message = {
          type: "text",
          text: "ขอโทษค่ะ ไม่มีกิจกรรมอื่นให้เลือกแล้ว กรุณาลองทำกิจกรรมนี้ หรือกลับไปเมนูหลักเพื่อเลือกทำอย่างอื่น",
        };
        message.quickReply = quickReplyNavigation;
        return message;
      }

      user.recommendedActivity = newActivity;
      currentActivity.type = newActivity.name;
      currentActivity.interactive = newActivity.interactive;
      currentActivity.progress = 0;
      currentActivity.completed = false;
      currentActivity.liked = null;
      currentActivity.dateStarted = new Date();
      currentActivity.currentStep = 0;
      currentActivity.goal = newActivity.goal || 0;
      currentActivity.maxSteps = newActivity.steps
        ? newActivity.steps.length
        : 0;
      user.hasConfirmedActivity = false;
      await user.save();
      return messages.activityRecommendation(newActivity);
    }
  }

  if (userMessage === "บันทึกอารมณ์") {
    user.step = 6;
    await user.save();
    return messages.moodSelection();
  }

  if (
    [
      "อารมณ์แย่มาก 😢",
      "อารมณ์แย่ 😔",
      "อารมณ์ปกติ 😐",
      "อารมณ์ดี 🙂",
      "อารมณ์ดีมาก 😊",
    ].includes(userMessage)
  ) {
    const moodMap = {
      "อารมณ์แย่มาก 😢": "แย่มาก",
      "อารมณ์แย่ 😔": "แย่",
      "อารมณ์ปกติ 😐": "ปกติ",
      "อารมณ์ดี 🙂": "ดี",
      "อารมณ์ดีมาก 😊": "ดีมาก",
    };
    const mood = moodMap[userMessage];
    user.moodLogs.push({ mood, date: new Date() });
    user.step = 1;
    await user.save();
    const message = {
      type: "text",
      text: "บันทึกอารมณ์เรียบร้อยแล้วค่ะ",
    };
    message.quickReply = quickReplyNavigation;
    return message;
  }

  if (userMessage === "คำประจำวัน") {
    const latestMood = user.moodLogs[user.moodLogs.length - 1]?.mood || "ปกติ";
    return messages.affirmation(latestMood, user.history);
  }

  if (userMessage === "ความคืบหน้า") {
    return messages.progressTracker(user.moodLogs, user.history);
  }

  if (userMessage === "ผลกิจกรรม") {
    return messages.activityResults(user.history);
  }

  if (userMessage === "ประวัติทดสอบ") {
    const testHistory = user.history.filter((h) =>
      ["GAD7", "PSS"].includes(h.testType),
    );
    if (!testHistory.length) {
      const message = { type: "text", text: "คุณยังไม่มีประวัติการทดสอบค่ะ" };
      message.quickReply = quickReplyNavigation;
      return message;
    }
    const summary = testHistory
      .slice(-5)
      .map(
        (h) =>
          `${h.testType}: ${h.score} คะแนน (${moment(h.date).format("DD/MM")})`,
      )
      .join("\n");
    return {
      type: "flex",
      altText: "ประวัติการทดสอบ",
      contents: {
        type: "bubble",
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: "📋 ประวัติการทดสอบ",
              weight: "bold",
              size: "lg",
            },
            {
              type: "text",
              text: summary,
              wrap: true,
              size: "sm",
              margin: "md",
            },
          ],
          paddingAll: "lg",
        },
        footer: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "button",
              style: "secondary",
              action: { type: "message", label: "กลับ", text: "เมนูหลัก" },
            },
          ],
          paddingAll: "md",
        },
      },
    };
  }

  const message = {
    type: "text",
    text: 'ไม่เข้าใจคำสั่ง กรุณาลองใหม่หรือพิมพ์ "ช่วยเหลือ" เพื่อดูคำสั่งทั้งหมด',
  };
  message.quickReply = quickReplyNavigation;
  logger.warn(`User ${userId} - Unrecognized command: ${userMessage}`);
  return message;
}

// Webhook
app.post("/webhook", line.middleware(lineConfig), async (req, res) => {
  try {
    logger.info("Webhook received: " + JSON.stringify(req.body));
    const events = req.body.events;
    for (const event of events) {
      if (event.type === "message") {
        const reply = await handleCommand(event);
        if (Array.isArray(reply)) {
          await client.replyMessage(event.replyToken, reply);
        } else {
          await client.replyMessage(event.replyToken, reply);
        }
      }
    }
    res.status(200).json({ status: "success" });
  } catch (error) {
    logger.error(`Webhook error: ${error.message}`);
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Start Server
const port = process.env["PORT"] || 3000;
app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});
