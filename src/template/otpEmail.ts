const adminLoginOtpEmailTemplate = (otp: any) => `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>User Query Received</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
                margin: 0;
                padding: 0;
            }
            .container {
                max-width: 600px;
                margin: 20px auto;
                background-color: #ffffff;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }
            .header {
                background-color: #007bff;
                color: #ffffff;
                padding: 10px;
                text-align: center;
                font-size: 20px;
                font-weight: bold;
                border-radius: 8px 8px 0 0;
            }
            .content {
                padding: 20px;
                font-size: 16px;
                color: #333333;
                line-height: 1.6;
            }
            .message-box {
                background-color: #f9f9f9;
                padding: 15px;
                border-left: 4px solid #007bff;
                margin-top: 10px;
                font-style: italic;
            }
            .info-box {
                background-color: #eef6ff;
                padding: 10px;
                margin-top: 15px;
                border-left: 4px solid #007bff;
            }
            .footer {
                margin-top: 20px;
                font-size: 14px;
                color: #777777;
                text-align: center;
                padding: 10px;
                border-top: 1px solid #dddddd;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">Login otp</div>
            <div class="content">
                <p><strong>Dear User,</strong></p>
                <p>Your otp   is : <strong>${otp || "N/A"}</strong>.</p>
                
              
    
              
            </div>
            <div class="footer">
                &copy; ${new Date().getFullYear()} phonix health and fitness | All Rights Reserved
            </div>
        </div>
    </body>
    </html>`;

module.exports = { adminLoginOtpEmailTemplate };
