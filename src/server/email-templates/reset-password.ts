export const getResetPasswordEmail = (link: string, name: string) =>
  `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        h1 {
            color: #333333;
        }
        p {
            color: #555555;
            line-height: 1.6;
        }
        .button {
            display: inline-block;
            margin-top: 20px;
            padding: 10px 20px;
            color: #ffffff;
            background-color: #007bff;
            text-decoration: none;
            border-radius: 5px;
        }
        .footer {
            margin-top: 30px;
            font-size: 12px;
            color: #999999;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Reset Your Password</h1>
        <p>Hello [Name],</p>
        <p>You recently requested to reset your password for your EduCBT account. Click the button below to reset it.</p>
        <a href="[Reset Link]" class="button">Reset Password</a>
        <p>If you did not request a password reset, please ignore this email or contact support if you have questions.</p>
        <p>Thanks, <br>EduCBT Team</p>
        <div class="footer">
            <p>If you're having trouble clicking the "Reset Password" button, copy and paste the URL below into your web browser:</p>
            <p><a href="[Reset Link]">[Reset Link]</a></p>
        </div>
    </div>
</body>
</html>
`
    .replaceAll('[Reset Link]', link)
    .replaceAll('[Name]', name)
