// import nodemailer from "nodemailer";
// import { useRuntimeConfig } from '#imports';
// const config = useRuntimeConfig();
// const transporter = nodemailer.createTransport({
//     service: "qq",
//     port: 465,
//     secure: true,
//     auth: {
//         user:config.emailUser,
//         pass: config.emailPass,
//     },
// });

// /**
//  * 发送验证码邮件
//  * @param to 接收邮箱
//  * @param code 验证码
//  * @returns Promise<boolean> 发送是否成功
//  */

// export async function sendVerificationEmail(
//     to: string,
//     code: string,
// ): Promise<boolean> {
//     try {
//         const mailOptions = {
//             from: `"Webhomework" <${config.emailUser}>`, 
//             to, // 收件人
//             subject: "注册验证码", // 邮件主题
//             html: `
//               <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
//                 <h2 style="color: #333;">欢迎注册</h2>
//                 <p>您好，感谢您注册我们的服务。</p>
//                 <p>您的验证码是：</p>
//                 <div style="background-color: #f5f5f5; padding: 10px; font-size: 24px; text-align: center; margin: 20px 0; letter-spacing: 5px; font-weight: bold;">
//                   ${code}
//                 </div>
//                 <p>验证码有效期为10分钟，请勿将验证码泄露给他人。</p>
//                 <p>如果您没有注册我们的服务，请忽略此邮件。</p>
//                 <p style="color: #777; font-size: 12px; margin-top: 20px;">此邮件由系统自动发送，请勿回复。</p>
//               </div>
//             `,
//         };
//         await transporter.sendMail(mailOptions);
//         return true;
//     } catch (error) {
//         console.error("发送邮件失败", error);
//         return false;
//     }
// }


// export function generateVerificationCode(length: number = 6): string {
//     const digits = "0123456789";
//     let code = "";
//     for (let i = 0; i < length; i++) {
//         const randomIndex = Math.floor(Math.random() * digits.length);
//         code += digits[randomIndex];
//     }
//     return code;
// }
import nodemailer from "nodemailer";
import { useRuntimeConfig } from '#imports';

export async function sendVerificationEmail(
    to: string,
    code: string,
): Promise<boolean> {
    try {
        const config = useRuntimeConfig();
        
        // 检查配置是否存在
        if (!config.emailUser || !config.emailPass) {
            console.error("邮箱配置缺失，请检查环境变量 EMAIL_USER 和 EMAIL_PASS");
            return false;
        }
        
        const transporter = nodemailer.createTransport({
            service: "qq",
            port: 465,
            secure: true,
            auth: {
                user: config.emailUser,
                pass: config.emailPass,
            },
        });
        
        // 测试邮箱连接
        try {
            await transporter.verify();
            console.log("邮箱连接验证成功");
        } catch (verifyError) {
            console.error("邮箱连接验证失败:", verifyError);
            return false;
        }
        
        const mailOptions = {
            from: `"Webhomework" <${config.emailUser}>`, 
            to, // 收件人
            subject: "验证码", // 邮件主题
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
                <h2 style="color: #333;">您的验证码</h2>
                <p>您好，感谢您使用我们的服务。</p>
                <p>您的验证码是：</p>
                <div style="background-color: #f5f5f5; padding: 10px; font-size: 24px; text-align: center; margin: 20px 0; letter-spacing: 5px; font-weight: bold;">
                  ${code}
                </div>
                <p>验证码有效期为10分钟，请勿将验证码泄露给他人。</p>
                <p>如果您没有请求此验证码，请忽略此邮件。</p>
                <p style="color: #777; font-size: 12px; margin-top: 20px;">此邮件由系统自动发送，请勿回复。</p>
              </div>
            `,
        };
        
        console.log(`尝试发送邮件到: ${to}`);
        const info = await transporter.sendMail(mailOptions);
        console.log("邮件发送成功:", info.messageId);
        return true;
    } catch (error) {
        console.error("发送邮件失败，详细错误:", error);
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