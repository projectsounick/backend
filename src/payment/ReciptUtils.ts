// utils/generateReceiptPdf.ts
import puppeteer from "puppeteer";
function generateHtml(receipt: any): string {
  console.log("this is");

  console.log(receipt.cartItems);

  return `
  <!DOCTYPE html>
  <html>
    <head>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          padding: 30px;
          color: #333;
        }
        h1 {
          text-align: center;
          margin-bottom: 30px;
          color: #2c3e50;
        }
        .info {
          margin-bottom: 25px;
        }
        .item {
          border: 1px solid #ccc;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
          background-color: #f9f9f9;
        }
        .item h3 {
          margin-top: 0;
          color: #34495e;
        }
        ul {
          margin: 8px 0 0 20px;
        }
        .footer {
          position: fixed;
          bottom: 30px;
          width: 100%;
          text-align: center;
          font-size: 12px;
          color: #777;
          border-top: 1px dashed #ccc;
          padding-top: 10px;
        }
        .total {
          font-weight: bold;
          font-size: 16px;
          margin-top: 10px;
        }
      </style>
    </head>
    <body>
      <h1>Payment Receipt</h1>
      
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
            } else {
              return ""; // Skip unknown or malformed items
            }
          })
          .join("")}
      </div>

      <div class="info total">
        <p><strong>Total Amount Paid:</strong> ₹${receipt.amount}</p>
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
