const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const randomDelay = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const sendEmail = async (payload) => {
    // Simulate sending a new email
    const errorChance = Math.random();
    if (errorChance < 0.15) {
        throw new Error("Failed to send email");
    }
    const delay = randomDelay(500, 2000);
    await sleep(delay);
    console.log(`Email sent to ${payload.to} with subject "${payload.subject}"`);
    return { sent: true, to: payload.to };
};

const resizeImage = async (payload) => {
    const delay = randomDelay(1000, 3000);
    await sleep(delay);
    console.log(`Image resized to ${payload.width}x${payload.height}`);
    return { resized: true, dimensions: `${payload.width}x${payload.height}` };
};

const generateReport = async (payload) => {
    const delay = randomDelay(2000, 5000);
    await sleep(delay);
    console.log(`Report generated with title "${payload.title}"`);
    return { generated: true, title: payload.title, reportType: payload.reportType };
};

const processData = async (payload) => {
    const delay = randomDelay(300, 500);
    await sleep(delay);
    console.log(`Data processed with action "${payload.action}"`);
    return { processed: true, records: payload.records };
}

const jobHandlers = {
    'send_email': sendEmail,
    'resize_image': resizeImage,
    'generate_report': generateReport,
    'process_data': processData
};

module.exports = {
    jobHandlers
};