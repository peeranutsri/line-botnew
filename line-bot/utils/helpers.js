const axios = require("axios");

function getActivityLevel(testType, score) {
  if (testType === "GAD7") {
    if (score <= 4) return "low";
    if (score <= 9) return "medium";
    if (score <= 14) return "high";
    return "severe";
  } else if (testType === "PSS") {
    if (score <= 13) return "low";
    if (score <= 26) return "medium";
    return "high";
  }
  return "low";
}

function getRecommendedActivity(testType, level, history, recommendations) {
  const availableActivities = recommendations[testType][level] || [];

  const dislikedActivities = history
    .filter((h) => h.testType.startsWith("Activity_") && h.liked === false)
    .map((h) => h.testType.replace("Activity_", ""));

  const filteredActivities = availableActivities.filter(
    (activity) => !dislikedActivities.includes(activity.name),
  );

  if (filteredActivities.length === 0) {
    return availableActivities[0] || {};
  }

  const randomIndex = Math.floor(Math.random() * filteredActivities.length);
  return filteredActivities[randomIndex];
}

function getTherapyRecommendation(testType, score) {
  if (testType === "GAD7") {
    if (score <= 4) return "ความวิตกกังวลต่ำ";
    if (score <= 9) return "ความวิตกกังวลปานกลาง";
    if (score <= 14) return "ความวิตกกังวลสูง";
    return "ความวิตกกังวลรุนแรง";
  } else if (testType === "PSS") {
    if (score <= 13) return "ความเครียดต่ำ";
    if (score <= 26) return "ความเครียดปานกลาง";
    return "ความเครียดสูง";
  }
  return "ไม่สามารถประเมินได้";
}

async function findNearbyHospitals(latitude, longitude) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return null;
  }

  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=5000&type=hospital&key=${apiKey}`;
  try {
    const response = await axios.get(url);
    const hospitals = response.data.results.slice(0, 5).map((place) => ({
      name: place.name,
      address: place.vicinity,
      url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.place_id}`,
    }));
    return hospitals.length > 0 ? hospitals : null;
  } catch (error) {
    return null;
  }
}

module.exports = {
  getActivityLevel,
  getRecommendedActivity,
  getTherapyRecommendation,
  findNearbyHospitals,
};
