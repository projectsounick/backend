// utils/generateReceiptPdf.ts
import puppeteer from "puppeteer";
function generateHtml(receipt: any): string {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          padding: 40px;
          color: #2c3e50;
          background-color: #f5f6fa;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #ddd;
          padding-bottom: 15px;
          margin-bottom: 30px;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          color: #2c3e50;
        }
        .logo {
          height: 60px;
        }
        .info {
          margin-bottom: 25px;
          background: #fff;
          padding: 15px 20px;
          border-radius: 10px;
          box-shadow: 0px 2px 6px rgba(0,0,0,0.08);
        }
        .info p {
          margin: 5px 0;
        }
        .items {
          margin-bottom: 30px;
        }
        .item {
          border: 1px solid #e0e0e0;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 15px;
          background-color: #ffffff;
          box-shadow: 0px 2px 4px rgba(0,0,0,0.05);
        }
        .item h3 {
          margin-top: 0;
          color: #34495e;
          font-size: 18px;
          margin-bottom: 10px;
        }
        .item p {
          margin: 3px 0;
          font-size: 14px;
        }
        .total {
          font-weight: bold;
          font-size: 18px;
          text-align: right;
          margin-top: 20px;
          background: #ecf0f1;
          padding: 10px 15px;
          border-radius: 8px;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          font-size: 12px;
          color: #777;
          border-top: 1px dashed #ccc;
          padding-top: 10px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Payment Receipt</h1>
        <img src="https://inessstorage.blob.core.windows.net/iness-public/logo.webp" class="logo" />
      </div>
      
      <div class="info">
        <p><strong>Name:</strong> ${receipt.userDetails?.name ?? "-"}</p>
        <p><strong>Email:</strong> ${receipt.userDetails?.email ?? "-"}</p>
        <p><strong>Order ID:</strong> ${receipt.orderId}</p>
        <p><strong>Status:</strong> ${receipt.status}</p>
        <p><strong>Date:</strong> ${new Date(
          receipt.createdAt
        ).toLocaleString()}</p>
      </div>

      <div class="items">
        ${receipt.cartItems
          .map((item: any) => {
            if (item.plan) {
              return `
                <div class="item">
                  <h3>Training Plan - ${item.plan.title ?? "Untitled Plan"}</h3>
                  <p><strong>Duration:</strong> ${
                    item.plan.planItem?.duration ?? "-"
                  } ${item.plan.planItem?.durationType ?? ""}</p>
                  <p><strong>Sessions:</strong> ${
                    item.plan.planItem?.sessionCount ?? "-"
                  }</p>
                  <p><strong>Quantity:</strong> ${item.quantity ?? 1}</p>
                </div>
              `;
            } else if (item.dietPlanDetails) {
              return `
                <div class="item">
                  <h3>Diet Plan - ${
                    item.dietPlanDetails.title ?? "Untitled Diet Plan"
                  }</h3>
                  <p><strong>Price:</strong> ₹${
                    item.dietPlanDetails.price ?? "-"
                  }</p>
                  <p><strong>Duration:</strong> ${
                    item.dietPlanDetails.duration ?? "-"
                  } ${item.dietPlanDetails.durationType ?? ""}</p>
                  <p><strong>Quantity:</strong> ${item.quantity ?? 1}</p>
                </div>
              `;
            } else if (item.serviceDetails) {
              return `
                <div class="item">
                  <h3>Service - ${
                    item.serviceDetails.title ?? "Untitled Service"
                  }</h3>
                  <p><strong>Price:</strong> ₹${
                    item.serviceDetails.price ?? "-"
                  }</p>
                  <p><strong>Quantity:</strong> ${item.quantity ?? 1}</p>
                </div>
              `;
            } else {
              return "";
            }
          })
          .join("")}
      </div>

      <div class="total">
        Total Amount Paid: ₹${receipt.amount}
      </div>

      <div class="footer">
        Phonix Health And Fitness | 8910600079 <br />
        40/1 Kankrapara Lane, Howrah - 711104
      </div>
    </body>
  </html>
  `;
}

export async function generateReceiptPdf(receipt: any): Promise<any> {
  const browser = await puppeteer.launch({ headless: true });

  const page = await browser.newPage();
  console.log(receipt);

  const htmlContent = generateHtml(receipt[0]);
  await page.setContent(htmlContent, { waitUntil: "networkidle0" });

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: { top: "40px", bottom: "60px", left: "30px", right: "30px" },
  });

  await browser.close();
  return pdfBuffer;
}
