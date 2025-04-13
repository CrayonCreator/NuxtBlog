import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "qq",
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

/**
 * 发送验证码邮件
 * @param to 接收邮箱
 * @param code 验证码
 * @returns Promise<boolean> 发送是否成功
 */

export async function sendVerificationEmail(
    to: string,
    code: string,
): Promise<boolean> {
    try {
        const mailOptions = {
            from: `"Webhomework" <${process.env.EMAIL_USER}>`, // 发件人
            to, // 收件人
            subject: "注册验证码", // 邮件主题
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
                <h2 style="color: #333;">欢迎注册</h2>
                <p>您好，感谢您注册我们的服务。</p>
                <p>您的验证码是：</p>
                <div style="background-color: #f5f5f5; padding: 10px; font-size: 24px; text-align: center; margin: 20px 0; letter-spacing: 5px; font-weight: bold;">
                  ${code}
                </div>
                <p>验证码有效期为10分钟，请勿将验证码泄露给他人。</p>
                <p>如果您没有注册我们的服务，请忽略此邮件。</p>
                <p style="color: #777; font-size: 12px; margin-top: 20px;">此邮件由系统自动发送，请勿回复。</p>
              </div>
            `,
        };
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error("发送邮件失败", error);
        return false;
    }
}


export function generateVerificationCode(length: number = 6): string {
    const digits = "0123456789";
    let code = "";
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * digits.length);
        code += digits[randomIndex];
    }
    return code;
}