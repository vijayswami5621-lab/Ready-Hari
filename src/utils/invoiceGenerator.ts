import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";
import { db } from "../firebase/config";
import { doc, updateDoc } from "firebase/firestore";

// Helper to convert image URL to base64
const getBase64ImageFromUrl = async (imageUrl: string): Promise<string> => {
  try {
    const res = await fetch(imageUrl);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error("Failed to convert image to base64", err);
    return "";
  }
};

export const generateInvoicePDF = async (order: any, settings?: any) => {
  const docPDF = new jsPDF();
  const pageWidth = docPDF.internal.pageSize.getWidth();

  // Settings (Fallback to defaults)
  const companyName = settings?.companyName || "Hari Pathshala";
  const founderName = settings?.founderName || "Amar Das";
  const companyAddress =
    settings?.companyAddress || "123 Spiritual Way, Vrindavan, UP 281121";
  const supportEmail = settings?.supportEmail || "support@haripathshala.online";
  const mobileNumber = settings?.mobileNumber || "+91 9876543210";
  const gstNumber = settings?.gstNumber || "GST123456789";
  const website = "https://haripathshala.online";
  const invoicePrefix = settings?.invoicePrefix || "INV-";

  const customerName =
    order.customerInfo?.fullName ||
    order.shippingAddress?.fullName ||
    "Customer";
  const customerEmail =
    order.customerInfo?.email || order.shippingAddress?.email || "N/A";
  const customerMobile =
    order.customerInfo?.mobile || order.shippingAddress?.mobile || "N/A";

  const addr = order.shippingAddress;
  const addressLine = addr
    ? `${addr.houseNo}, ${addr.street}, ${addr.village}, ${addr.city}, ${addr.district}, ${addr.state} - ${addr.pincode}, ${addr.country}`
    : "N/A";

  // Format Date
  const invoiceDate = new Date().toLocaleDateString("en-IN");
  let orderDate = "N/A";
  if (order.createdAt?.seconds) {
    orderDate = new Date(order.createdAt.seconds * 1000).toLocaleDateString(
      "en-IN",
    );
  } else if (order.createdAt) {
    try {
      orderDate = new Date(order.createdAt).toLocaleDateString("en-IN");
    } catch (e) {}
  }

  const invoiceNumber =
    order.invoiceNumber ||
    `${invoicePrefix}${order.id?.slice(0, 10).toUpperCase()}`;

  // HEADER & LOGO
  let currentY = 20;
  if (settings?.appLogo) {
    const logoBase64 = await getBase64ImageFromUrl(settings.appLogo);
    if (logoBase64) {
      // Draw circular container background
      docPDF.setFillColor(255, 255, 255);
      docPDF.setDrawColor(230, 230, 230);
      docPDF.circle(26.5, 27.5, 13, "FD"); // Fill and Draw

      docPDF.addImage(logoBase64, "PNG", 15.5, 16.5, 22, 22);
      currentY = 45; // Adjust start Y for text if logo is present
    }
  }

  docPDF.setFontSize(22);
  docPDF.setTextColor(217, 119, 6); // Saffron color approx
  docPDF.text(companyName, 14, currentY);

  docPDF.setFontSize(10);
  docPDF.setTextColor(100);
  docPDF.text(`Founder: ${founderName}`, 14, currentY + 7);
  docPDF.text(companyAddress, 14, currentY + 12);
  docPDF.text(
    `Email: ${supportEmail} | Phone: ${mobileNumber}`,
    14,
    currentY + 17,
  );
  docPDF.text(`Website: ${website} | GST: ${gstNumber}`, 14, currentY + 22);

  // INVOICE TITLE & QR CODE
  docPDF.setFontSize(16);
  docPDF.setTextColor(0);
  docPDF.text("TAX INVOICE", pageWidth - 14, 20, { align: "right" });

  docPDF.setFontSize(10);
  docPDF.text(`Invoice No: ${invoiceNumber}`, pageWidth - 14, 27, {
    align: "right",
  });
  docPDF.text(`Date: ${invoiceDate}`, pageWidth - 14, 32, { align: "right" });

  // Generate QR Code
  try {
    const qrData = `Order: ${order.id}\nInvoice: ${invoiceNumber}\nTracking: ${order.trackingNumber || "N/A"}`;
    const qrCodeDataUrl = await QRCode.toDataURL(qrData);
    docPDF.addImage(qrCodeDataUrl, "PNG", pageWidth - 40, 38, 25, 25);
  } catch (err) {
    console.error("QR Code generation failed", err);
  }

  // BILL TO
  const billToY = Math.max(currentY + 35, 75);
  docPDF.setFontSize(12);
  docPDF.setTextColor(0);
  docPDF.setFont("helvetica", "bold");
  docPDF.text("Bill To:", 14, billToY);

  docPDF.setFontSize(10);
  docPDF.setFont("helvetica", "normal");
  docPDF.setTextColor(80);
  docPDF.text(customerName, 14, billToY + 7);
  const splitAddress = docPDF.splitTextToSize(addressLine, 90);
  docPDF.text(splitAddress, 14, billToY + 12);
  docPDF.text(
    `Phone: ${customerMobile}`,
    14,
    billToY + 12 + splitAddress.length * 5,
  );
  docPDF.text(
    `Email: ${customerEmail}`,
    14,
    billToY + 17 + splitAddress.length * 5,
  );

  // ORDER DETAILS
  docPDF.setFontSize(12);
  docPDF.setTextColor(0);
  docPDF.setFont("helvetica", "bold");
  docPDF.text("Order Details:", pageWidth / 2, billToY);

  docPDF.setFontSize(10);
  docPDF.setFont("helvetica", "normal");
  docPDF.setTextColor(80);
  docPDF.text(`Order ID: ${order.id || "N/A"}`, pageWidth / 2, billToY + 7);
  docPDF.text(`Order Date: ${orderDate}`, pageWidth / 2, billToY + 12);
  docPDF.text(
    `Payment Method: ${order.paymentMethod?.toUpperCase() || "N/A"}`,
    pageWidth / 2,
    billToY + 17,
  );
  docPDF.text(
    `Payment ID: ${order.paymentId || "N/A"}`,
    pageWidth / 2,
    billToY + 22,
  );
  docPDF.text(
    `Tracking No: ${order.trackingNumber || "N/A"}`,
    pageWidth / 2,
    billToY + 27,
  );

  // ITEMS TABLE
  const tableData = (order.items || []).map((item: any, index: number) => {
    const itemTotal = (item.price || 0) * (item.quantity || 1);
    const itemDiscount = item.discount || 0;
    const itemTax = item.tax || 0;
    return [
      index + 1,
      item.title || "Product",
      item.quantity || 1,
      `Rs. ${item.price || 0}`,
      `Rs. ${itemDiscount}`,
      `Rs. ${itemTax}`,
      `Rs. ${itemTotal - itemDiscount + itemTax}`,
    ];
  });

  autoTable(docPDF, {
    startY: billToY + 35,
    head: [
      [
        "#",
        "Item Description",
        "Qty",
        "Unit Price",
        "Discount",
        "Tax",
        "Total",
      ],
    ],
    body: tableData,
    theme: "grid",
    headStyles: { fillColor: [217, 119, 6] },
    styles: { fontSize: 10 },
  });

  // SUMMARY
  let finalY = (docPDF as any).lastAutoTable.finalY + 10;

  const subtotal = order.subtotal || order.totalAmount || 0;
  const shipping = order.shippingFee || 0;
  const totalAmount = order.totalAmount || subtotal + shipping;

  docPDF.text("Subtotal:", pageWidth - 60, finalY);
  docPDF.text(`Rs. ${subtotal}`, pageWidth - 14, finalY, { align: "right" });

  docPDF.text("Shipping:", pageWidth - 60, finalY + 6);
  docPDF.text(
    shipping === 0 ? "FREE" : `Rs. ${shipping}`,
    pageWidth - 14,
    finalY + 6,
    { align: "right" },
  );

  docPDF.setFont("helvetica", "bold");
  docPDF.text("Grand Total:", pageWidth - 60, finalY + 14);
  docPDF.text(`Rs. ${totalAmount}`, pageWidth - 14, finalY + 14, {
    align: "right",
  });

  // DIGITAL SIGNATURE
  if (settings?.signatureUrl) {
    const sigBase64 = await getBase64ImageFromUrl(settings.signatureUrl);
    if (sigBase64) {
      docPDF.addImage(sigBase64, "PNG", pageWidth - 60, finalY + 25, 40, 20);
      docPDF.setFontSize(8);
      docPDF.text("Authorized Signatory", pageWidth - 40, finalY + 48, {
        align: "center",
      });
    }
  }

  // FOOTER
  docPDF.setFont("helvetica", "normal");
  docPDF.setFontSize(8);
  docPDF.setTextColor(150);
  const footerMsg =
    settings?.invoiceFooterMessage ||
    "Thank you for shopping with Hari Pathshala. This is a computer generated invoice.";
  docPDF.text(
    footerMsg,
    pageWidth / 2,
    docPDF.internal.pageSize.getHeight() - 15,
    { align: "center" },
  );
  docPDF.text(
    `For support, email: ${supportEmail} or call: ${mobileNumber}`,
    pageWidth / 2,
    docPDF.internal.pageSize.getHeight() - 10,
    { align: "center" },
  );

  // SAVE
  docPDF.save(`Invoice_${invoiceNumber}.pdf`);

  // Optionally update Firestore to record generation time if not already generated
  if (!order.invoiceGeneratedAt && order.id) {
    try {
      await updateDoc(doc(db, "orders", order.id), {
        invoiceGeneratedAt: new Date().toISOString(),
        invoiceNumber: invoiceNumber,
      });
    } catch (e) {
      console.error("Failed to update invoice generated time", e);
    }
  }
};
