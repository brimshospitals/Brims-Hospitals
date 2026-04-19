/**
 * SMS utility — Fast2SMS
 * Use karo: sendSms(mobile, message)
 */

export async function sendSms(mobile, message) {
  const apiKey = process.env.FAST2SMS_API_KEY;

  if (!apiKey) {
    console.log(`📱 [DEV SMS] To: ${mobile} | Msg: ${message}`);
    return { success: true, dev: true };
  }

  try {
    const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        route:   "q",          // quick/transactional route
        message: message,
        flash:   0,
        numbers: mobile,
      }),
    });

    const data = await res.json();

    if (!data.return) {
      console.error("Fast2SMS error:", data.message);
      return { success: false, error: data.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Fast2SMS network error:", err.message);
    return { success: false, error: err.message };
  }
}