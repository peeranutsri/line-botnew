const moment = require("moment");
const RELAXATION_VIDEOS = require("./relaxationVideos");
const { getActivityLevel } = require("./helpers");

const quickReplyNavigation = {
  items: [
    {
      type: "action",
      action: { type: "message", label: "เมนูหลัก", text: "เมนูหลัก" },
    },
    {
      type: "action",
      action: { type: "message", label: "คำสั่ง", text: "ช่วยเหลือ" },
    },
  ],
};

const messages = {
  intro: () => ({
    type: "flex",
    altText: "ยินดีต้อนรับสู่ MindEase Bot",
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: "สวัสดีค่ะ! 👋", weight: "bold", size: "lg" },
          {
            type: "text",
            text: "MindEase Bot พร้อมช่วยดูแลสุขภาพจิตของคุณ",
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
            action: { type: "message", label: "ทำแบบทดสอบ", text: "แบบทดสอบ" },
            margin: "sm",
          },
          {
            type: "text",
            text: "ประเมินความวิตกกังวลหรือความเครียดด้วยแบบทดสอบมาตรฐาน",
            size: "xs",
            color: "#666666",
            margin: "sm",
          },
          {
            type: "button",
            style: "secondary",
            action: {
              type: "message",
              label: "บันทึกอารมณ์",
              text: "บันทึกอารมณ์",
            },
            margin: "sm",
          },
          {
            type: "text",
            text: "บันทึกความรู้สึกประจำวันเพื่อติดตามอารมณ์",
            size: "xs",
            color: "#666666",
            margin: "sm",
          },
          {
            type: "button",
            style: "secondary",
            action: { type: "message", label: "ฉุกเฉิน", text: "ฉุกเฉิน" },
            margin: "sm",
          },
          {
            type: "text",
            text: "เข้าถึงเบอร์ฉุกเฉิน",
            size: "xs",
            color: "#666666",
            margin: "sm",
          },
          {
            type: "button",
            style: "secondary",
            action: { type: "message", label: "ดูคำสั่ง", text: "ช่วยเหลือ" },
            margin: "sm",
          },
          {
            type: "text",
            text: "ดูคำสั่งทั้งหมดที่ใช้งานได้",
            size: "xs",
            color: "#666666",
            margin: "sm",
          },
        ],
        paddingAll: "md",
      },
    },
  }),

  testIntro: () => ({
    type: "flex",
    altText: "เกี่ยวกับแบบทดสอบ",
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "text",
            text: "📝 แบบทดสอบสุขภาพจิต",
            weight: "bold",
            size: "lg",
          },
          {
            type: "text",
            text: "GAD-7 และ PSS เป็นเครื่องมือมาตรฐานสากล",
            wrap: true,
            size: "sm",
            margin: "md",
          },
          {
            type: "text",
            text: "พัฒนาโดยนักจิตวิทยาเพื่อประเมินสุขภาพจิต",
            wrap: true,
            size: "sm",
          },
          {
            type: "text",
            text: "GAD-7: ได้รับการยอมรับจาก WHO สำหรับวัดความวิตกกังวล (ความน่าเชื่อถือสูง > 0.85)",
            wrap: true,
            size: "sm",
            margin: "md",
          },
          {
            type: "text",
            text: "PSS: พัฒนาโดย Cohen et al. (1983) สำหรับวัดความเครียดในชีวิตประจำวัน (ความน่าเชื่อถือสูง > 0.80)",
            wrap: true,
            size: "sm",
          },
          {
            type: "text",
            text: "กรุณาตอบตามความรู้สึก ณ ขณะนี้ เพื่อผลลัพธ์ที่แม่นยำ",
            wrap: true,
            size: "sm",
            color: "#C62828",
            weight: "bold",
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
            action: { type: "message", label: "เริ่ม", text: "เริ่มต้น" },
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
  }),

  testSelection: () => ({
    type: "flex",
    altText: "เลือกแบบทดสอบ",
    contents: {
      type: "carousel",
      contents: [
        {
          type: "bubble",
          body: {
            type: "box",
            layout: "vertical",
            spacing: "sm",
            contents: [
              {
                type: "text",
                text: "🧠 GAD-7",
                weight: "bold",
                size: "xl",
                color: "#1DB446",
              },
              {
                type: "text",
                text: "ประเมินความวิตกกังวล",
                size: "sm",
                wrap: true,
              },
              {
                type: "text",
                text: "7 คำถาม (0-21 คะแนน)",
                size: "xs",
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
                color: "#1DB446",
                action: {
                  type: "message",
                  label: "เริ่ม GAD-7",
                  text: "แบบทดสอบGAD7",
                },
              },
            ],
            paddingAll: "md",
          },
        },
        {
          type: "bubble",
          body: {
            type: "box",
            layout: "vertical",
            spacing: "sm",
            contents: [
              {
                type: "text",
                text: "😓 PSS",
                weight: "bold",
                size: "xl",
                color: "#FF5733",
              },
              {
                type: "text",
                text: "ประเมินความเครียด",
                size: "sm",
                wrap: true,
              },
              {
                type: "text",
                text: "10 คำถาม (10-40 คะแนน)",
                size: "xs",
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
                color: "#FF5733",
                action: {
                  type: "message",
                  label: "เริ่ม PSS",
                  text: "แบบทดสอบPSS",
                },
              },
            ],
            paddingAll: "md",
          },
        },
      ],
    },
  }),

  question: (question, testType, questionNumber, totalQuestions) => {
    const options =
      testType === "GAD7"
        ? ["ไม่เลย (0)", "เล็กน้อย (1)", "ปานกลาง (2)", "มาก (3)"]
        : [
            "ไม่เคย (0)",
            "เกือบไม่เคย (1)",
            "บางครั้ง (2)",
            "บ่อย (3)",
            "บ่อยมาก (4)",
          ];

    return {
      type: "flex",
      altText: question,
      contents: {
        type: "bubble",
        header: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: `คำถาม ${questionNumber}/${totalQuestions}`,
              size: "sm",
              color: "#FFFFFF",
            },
          ],
          backgroundColor: testType === "GAD7" ? "#1DB446" : "#FF5733",
          paddingAll: "md",
        },
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: question,
              wrap: true,
              weight: "bold",
              size: "md",
            },
          ],
          paddingAll: "lg",
        },
        footer: {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          contents: options.map((opt, index) => ({
            type: "button",
            style: "primary",
            color: "#2196F3",
            action: { type: "message", label: opt, text: String(index) },
          })),
          paddingAll: "md",
        },
      },
    };
  },

  testResult: (testType, score, therapyAdvice, activity) => {
    const maxScore = testType === "GAD7" ? 21 : 40;
    const level = getActivityLevel(testType, score);
    const video =
      RELAXATION_VIDEOS[level][
        Math.floor(Math.random() * RELAXATION_VIDEOS[level].length)
      ];
    const levelColor =
      level === "low"
        ? "#4CAF50"
        : level === "medium"
          ? "#FFC107"
          : level === "high"
            ? "#FF5722"
            : "#D32F2F";

    return {
      type: "flex",
      altText: "ผลการประเมิน",
      contents: {
        type: "bubble",
        header: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: `ผลลัพธ์ ${testType} 🌟`,
              size: "lg",
              color: "#FFFFFF",
              weight: "bold",
              align: "center",
            },
          ],
          backgroundColor: testType === "GAD7" ? "#1DB446" : "#FF5733",
          paddingAll: "md",
        },
        body: {
          type: "box",
          layout: "vertical",
          spacing: "md",
          contents: [
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {
                  type: "text",
                  text: "📊 คะแนน:",
                  size: "sm",
                  weight: "bold",
                  color: "#666666",
                  flex: 2,
                },
                {
                  type: "text",
                  text: `${score}/${maxScore}`,
                  size: "xl",
                  weight: "bold",
                  color: "#000000",
                  flex: 3,
                  align: "end",
                },
              ],
              margin: "md",
            },
            {
              type: "separator",
              margin: "md",
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {
                  type: "text",
                  text: "🔍 ระดับ:",
                  size: "sm",
                  weight: "bold",
                  color: "#666666",
                  flex: 2,
                },
                {
                  type: "text",
                  text: therapyAdvice,
                  size: "md",
                  weight: "bold",
                  color: levelColor,
                  wrap: true,
                  flex: 3,
                  align: "end",
                },
              ],
              margin: "md",
            },
            {
              type: "separator",
              margin: "md",
            },
            {
              type: "text",
              text: "💡 กิจกรรมแนะนำ",
              weight: "bold",
              size: "md",
              margin: "md",
            },
            {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "text",
                  text: activity.name || "กิจกรรมไม่ระบุ",
                  wrap: true,
                  size: "sm",
                  weight: "bold",
                  color: "#1E88E5",
                },
                {
                  type: "text",
                  text:
                    activity.steps && activity.steps.length > 0
                      ? activity.steps[0]
                      : "ไม่มีคำอธิบาย",
                  wrap: true,
                  size: "xs",
                  color: "#666666",
                  margin: "sm",
                },
                {
                  type: "box",
                  layout: "horizontal",
                  contents: [
                    {
                      type: "button",
                      style: "primary",
                      color: "#4CAF50",
                      action: {
                        type: "message",
                        label: "👍 ถูกใจ",
                        text: "ถูกใจกิจกรรม",
                      },
                      flex: 2,
                      height: "sm",
                      margin: "sm",
                    },
                    {
                      type: "button",
                      style: "secondary",
                      color: "#B0BEC5",
                      action: {
                        type: "message",
                        label: "👎 ไม่ถูกใจ",
                        text: "ไม่ถูกใจกิจกรรม",
                      },
                      flex: 2,
                      height: "sm",
                      margin: "sm",
                    },
                  ],
                },
              ],
              margin: "sm",
              paddingAll: "md",
              backgroundColor: "#F5F5F5",
              cornerRadius: "md",
            },
            {
              type: "separator",
              margin: "md",
            },
            {
              type: "text",
              text: "🎥 คลิปผ่อนคลาย",
              weight: "bold",
              size: "md",
              margin: "md",
            },
            {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "text",
                  text: video.name,
                  wrap: true,
                  size: "sm",
                  weight: "bold",
                  color: "#1E88E5",
                },
                {
                  type: "text",
                  text: "กดลิงก์เพื่อดูคลิป",
                  wrap: true,
                  size: "xs",
                  color: "#666666",
                  margin: "sm",
                },
                {
                  type: "button",
                  style: "link",
                  action: {
                    type: "uri",
                    label: "ดูคลิป",
                    uri: video.url,
                  },
                },
              ],
              margin: "sm",
              paddingAll: "md",
              backgroundColor: "#F5F5F5",
              cornerRadius: "md",
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
                label: "ตั้งเตือนทุก 7 วัน",
                text: "ตั้งเตือน7วัน",
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
  },

  activityRecommendation: (activity) => {
    return {
      type: "flex",
      altText: "แนะนำกิจกรรม",
      contents: {
        type: "bubble",
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            { type: "text", text: "💡 กิจกรรมแนะนำ", weight: "bold" },
            {
              type: "text",
              text: activity.name || "กิจกรรมไม่ระบุ",
              wrap: true,
              size: "sm",
              weight: "bold",
              margin: "md",
            },
            {
              type: "text",
              text:
                activity.steps && activity.steps.length > 0
                  ? activity.steps[0]
                  : "ไม่มีคำอธิบาย",
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
          contents: [
            {
              type: "button",
              style: "primary",
              color: "#4CAF50",
              action: {
                type: "message",
                label: "👍 ถูกใจ",
                text: "ถูกใจกิจกรรม",
              },
            },
            {
              type: "button",
              style: "secondary",
              color: "#B0BEC5",
              action: {
                type: "message",
                label: "👎 ไม่ถูกใจ",
                text: "ไม่ถูกใจกิจกรรม",
              },
              margin: "sm",
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
  },

  interactiveActivityPrompt: (activity, round, totalRounds) => ({
    type: "flex",
    altText: `กิจกรรม: ${activity.name || "ไม่ระบุ"}`,
    contents: {
      type: "bubble",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: `ขั้นที่ ${round}/${totalRounds}`,
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
            text: activity.name || "กิจกรรมไม่ระบุ",
            wrap: true,
            weight: "bold",
            size: "md",
          },
          {
            type: "text",
            text: `พร้อมสำหรับขั้นที่ ${round}! ${activity.steps && activity.steps[round - 1] ? activity.steps[round - 1] : "ไม่มีคำอธิบาย"}`,
            wrap: true,
            size: "sm",
            margin: "md",
          },
          {
            type: "text",
            text: "กด 'ทำขั้นต่อไป' เพื่อเริ่มขั้นนี้",
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
              text: `ทำขั้น_${round}`,
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
  }),

  interactiveActivityComplete: (activity) => ({
    type: "flex",
    altText: `สำเร็จ: ${activity.name || "ไม่ระบุ"}`,
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
            text: `คุณทำกิจกรรม "${activity.name || "ไม่ระบุ"}" สำเร็จครบทุกขั้นแล้ว!`,
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
            action: { type: "message", label: "กลับ", text: "เมนูหลัก" },
            margin: "sm",
          },
        ],
        paddingAll: "md",
      },
    },
  }),

  moodSelection: () => ({
    type: "flex",
    altText: "บันทึกอารมณ์",
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "วันนี้คุณรู้สึกยังไง? 😊",
            size: "lg",
            weight: "bold",
          },
          {
            type: "text",
            text: "เลือกอารมณ์ที่ตรงกับคุณ",
            size: "sm",
            color: "#666666",
            margin: "md",
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
            color: "#2196F3",
            action: {
              type: "message",
              label: "ดีมาก 😊",
              text: "อารมณ์ดีมาก 😊",
            },
          },
          {
            type: "button",
            style: "primary",
            color: "#2196F3",
            action: { type: "message", label: "ดี 🙂", text: "อารมณ์ดี 🙂" },
            margin: "sm",
          },
          {
            type: "button",
            style: "primary",
            color: "#2196F3",
            action: {
              type: "message",
              label: "ปกติ 😐",
              text: "อารมณ์ปกติ 😐",
            },
            margin: "sm",
          },
          {
            type: "button",
            style: "primary",
            color: "#2196F3",
            action: { type: "message", label: "แย่ 😔", text: "อารมณ์แย่ 😔" },
            margin: "sm",
          },
          {
            type: "button",
            style: "primary",
            color: "#2196F3",
            action: {
              type: "message",
              label: "แย่มาก 😢",
              text: "อารมณ์แย่มาก 😢",
            },
            margin: "sm",
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
  }),

  activityResults: (history) => {
    const activityResults = history.filter((h) =>
      h.testType.startsWith("Activity_"),
    );
    if (!activityResults.length) {
      const message = { type: "text", text: "คุณยังไม่ได้ทำกิจกรรมใด ๆ ค่ะ" };
      message.quickReply = quickReplyNavigation;
      return message;
    }

    const summary = activityResults
      .slice(-5)
      .map((h) => {
        const status =
          h.completed === true
            ? "เสร็จแล้ว"
            : h.completed === false
              ? "ยังไม่เสร็จ"
              : "ยังไม่ได้ทำ";
        return `${h.testType.replace("Activity_", "")} - ${h.liked ? "ชอบ" : "ไม่ชอบ"} (${status}, ${moment(h.date).format("DD/MM")})`;
      })
      .join("\n");

    return {
      type: "flex",
      altText: "ผลลัพธ์กิจกรรม",
      contents: {
        type: "bubble",
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: "📋 ผลลัพธ์กิจกรรม",
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
  },

  affirmation: (mood, testHistory) => {
    const affirmations = {
      แย่มาก: [
        "คุณแข็งแกร่งกว่าที่คิด ทุกอย่างจะดีขึ้นแน่นอนค่ะ",
        "ถึงวันนี้จะยาก แต่คุณผ่านมันมาได้ และพรุ่งนี้จะดีกว่านี้ค่ะ",
        "ทุกก้าวเล็ก ๆ ที่คุณเดินคือความสำเร็จ คุณทำได้ดีมากแล้ว!",
        "ความรู้สึกนี้จะผ่านไป คุณมีพลังในตัวที่จะก้าวต่อไปค่ะ",
        "คุณไม่เคยอยู่คนเดียว มีคนพร้อมสนับสนุนคุณเสมอนะคะ",
      ],
      แย่: [
        "วันนี้คุณอาจรู้สึกไม่ดี แต่พรุ่งนี้จะเป็นวันที่ดีกว่านะคะ",
        "ทุกวันที่ผ่านไปคือโอกาสใหม่ คุณเก่งมากที่ยังสู้ต่อ!",
        "ลองให้เวลาตัวเองได้พักสักนิด คุณสมควรได้รับมันค่ะ",
        "ความรู้สึกแย่เป็นแค่ชั่วคราว คุณจะกลับมาเข้มแข็งได้แน่นอน",
        "คุณกำลังเรียนรู้และเติบโตจากทุกประสบการณ์ สุดยอดมากค่ะ",
      ],
      ปกติ: [
        "คุณทำได้ดีแล้ว! ก้าวต่อไปอย่างมั่นใจนะคะ",
        "วันนี้เป็นวันที่ดี และคุณทำให้มันพิเศษขึ้นด้วยตัวคุณเอง!",
        "ความสมดุลในใจคุณคือพลัง รักษามันไว้นะคะ",
        "ทุกอย่างกำลังไปได้สวย ทำต่อไป คุณเก่งมาก!",
        "คุณคือแรงบันดาลใจในแบบของคุณเอง ภูมิใจในตัวเองนะคะ",
      ],
      ดี: [
        "เยี่ยมมาก! ความรู้สึกดี ๆ จะอยู่กับคุณต่อไปค่ะ",
        "รอยยิ้มของคุณสว่างไสววันนี้ ทำต่อไปนะคะ!",
        "ความสุขของคุณคือพลังบวกที่ส่งต่อได้ คุณสุดยอดมาก!",
        "วันนี้คุณเปล่งประกาย เก็บความรู้สึกดี ๆ นี้ไว้นาน ๆ นะคะ",
        "คุณกำลังสร้างวันที่น่าจดจำ ขอให้มีวันดี ๆ แบบนี้ต่อไป!",
      ],
      ดีมาก: [
        "สุดยอด! คุณเปล่งประกายมากเลย ทำต่อไปนะคะ",
        "พลังบวกของคุณน่าทึ่ง! คุณคือแรงบันดาลใจของวันนี้ค่ะ",
        "วันนี้คุณคือดาวเด่น! ขอให้ความสุขนี้อยู่กับคุณตลอดไป",
        "คุณทำให้วันนี้พิเศษสุด ๆ ภูมิใจในตัวเองมาก ๆ นะคะ",
        "ความเข้มแข็งและความสุขของคุณคือของขวัญที่ยิ่งใหญ่ค่ะ",
      ],
    };

    const highScoreMessages = [
      "อย่าลืมดูแลตัวเองด้วยการทำกิจกรรมที่ชอบนะคะ",
      "ลองหาเวลาพักผ่อนหรือทำสิ่งที่ทำให้ใจสงบ คุณสมควรได้รับมันค่ะ",
      "ถ้าคุณรู้สึกหนักใจ ลองพูดคุยกับคนที่ไว้ใจหรือติดต่อสายด่วน 1323 ได้นะคะ",
      "การให้เวลากับตัวเองเป็นสิ่งสำคัญ คุณทำได้ดีมากแล้วค่ะ",
      "ลองฝึกหายใจลึก ๆ หรือทำกิจกรรมผ่อนคลายเพื่อเติมพลังให้ตัวเองนะคะ",
    ];

    const defaultMessages = [
      "คุณคือคนพิเศษ และ  �ุกวันคือโอกาสใหม่ในการเติบโตค่ะ",
      "ก้าวเล็ก ๆ วันนี้จะพาคุณไปสู่เป้าหมายใหญ่ ขอให้วันนี้เป็นวันที่ดี!",
      "ความเข้มแข็งของคุณคือแรงบันดาลใจ ทำต่อไปนะคะ",
      "ทุกช่วงเวลาคือโอกาสให้คุณได้เรียนรู้และเติบโต คุณเก่งมาก!",
      "วันนี้เป็นของคุณ ทำมันให้เป็นวันที่น่าจดจำนะคะ",
    ];

    const moodMessages = affirmations[mood] || defaultMessages;
    let selectedAffirmation =
      moodMessages[Math.floor(Math.random() * moodMessages.length)];

    const latestTest = testHistory.find((h) =>
      ["GAD7", "PSS"].includes(h.testType),
    );
    if (
      latestTest &&
      latestTest.score > (latestTest.testType === "GAD7" ? 14 : 31)
    ) {
      const highScoreMessage =
        highScoreMessages[Math.floor(Math.random() * highScoreMessages.length)];
      selectedAffirmation += `\n${highScoreMessage}`;
    }

    return {
      type: "flex",
      altText: "คำประจำวัน",
      contents: {
        type: "bubble",
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            { type: "text", text: "🌟 คำประจำวัน", weight: "bold", size: "lg" },
            {
              type: "text",
              text: selectedAffirmation,
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
  },

  progressTracker: (moodLogs, history) => {
    const moodDays = moodLogs.length;
    const activitiesCompleted = history.filter(
      (h) => h.testType.startsWith("Activity_") && h.completed === true,
    ).length;

    return {
      type: "flex",
      altText: "ความคืบหน้า",
      contents: {
        type: "bubble",
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: "🏆 ความคืบหน้าของคุณ",
              weight: "bold",
              size: "lg",
            },
            {
              type: "text",
              text: `📅 บันทึกอารมณ์: ${moodDays} วัน`,
              size: "sm",
              margin: "md",
            },
            {
              type: "text",
              text: `✅ ทำกิจกรรมสำเร็จ: ${activitiesCompleted} ครั้ง`,
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
              style: "secondary",
              action: { type: "message", label: "กลับ", text: "เมนูหลัก" },
            },
          ],
          paddingAll: "md",
        },
      },
    };
  },

  help: () => ({
    type: "flex",
    altText: "คำสั่งทั้งหมด",
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "text",
            text: "📋 คำสั่งทั้งหมด",
            weight: "bold",
            size: "lg",
          },
          {
            type: "text",
            text: "เลือกหมวดหมู่ด้านล่างเพื่อดูคำสั่ง",
            size: "sm",
            margin: "md",
          },
          { type: "separator", margin: "md" },
          {
            type: "text",
            text: "🧠 การทดสอบ",
            weight: "bold",
            size: "md",
            margin: "md",
          },
          {
            type: "text",
            text: "📊 ความคืบหน้า",
            weight: "bold",
            size: "md",
            margin: "md",
          },
          {
            type: "text",
            text: "😊 อารมณ์",
            weight: "bold",
            size: "md",
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
              type: "message",
              label: "การทดสอบ",
              text: "ช่วยเหลือ_ทดสอบ",
            },
          },
          {
            type: "button",
            style: "primary",
            action: {
              type: "message",
              label: "ความคืบหน้า",
              text: "ความคืบหน้า",
            },
            margin: "sm",
          },
          {
            type: "button",
            style: "primary",
            action: {
              type: "message",
              label: "อารมณ์",
              text: "ช่วยเหลือ_อารมณ์",
            },
            margin: "sm",
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
  }),

  helpTest: () => ({
    type: "flex",
    altText: "คำสั่งการทดสอบ",
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "text",
            text: "🧠 คำสั่งการทดสอบ",
            weight: "bold",
            size: "lg",
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
            action: { type: "message", label: "ทำแบบทดสอบ", text: "แบบทดสอบ" },
          },
          {
            type: "button",
            style: "secondary",
            action: {
              type: "message",
              label: "ดูประวัติทดสอบ",
              text: "ประวัติทดสอบ",
            },
            margin: "sm",
          },
          {
            type: "button",
            style: "secondary",
            action: { type: "message", label: "ผลกิจกรรม", text: "ผลกิจกรรม" },
            margin: "sm",
          },
          {
            type: "button",
            style: "secondary",
            action: { type: "message", label: "กลับ", text: "ช่วยเหลือ" },
            margin: "sm",
          },
        ],
        paddingAll: "md",
      },
    },
  }),

  helpMood: () => ({
    type: "flex",
    altText: "คำสั่งอารมณ์",
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          { type: "text", text: "😊 คำสั่งอารมณ์", weight: "bold", size: "lg" },
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
              label: "บันทึกอารมณ์",
              text: "บันทึกอารมณ์",
            },
          },
          {
            type: "button",
            style: "secondary",
            action: {
              type: "message",
              label: "คำประจำวัน",
              text: "คำประจำวัน",
            },
            margin: "sm",
          },
          {
            type: "button",
            style: "secondary",
            action: { type: "message", label: "กลับ", text: "ช่วยเหลือ" },
            margin: "sm",
          },
        ],
        paddingAll: "md",
      },
    },
  }),
};

module.exports = { messages, quickReplyNavigation };
