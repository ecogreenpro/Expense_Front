import React, { useEffect, useState } from "react";
import Header from "../../components/Header";
import { useNavigate } from "react-router-dom";
import { Button, Modal, Form, Container } from "react-bootstrap";
// import loading from "../../assets/loader.gif";
import "./home.css";
import { addTransaction, getTransactions } from "../../utils/ApiRequest";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Spinner from "../../components/Spinner";
import TableData from "./TableData";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import BarChartIcon from "@mui/icons-material/BarChart";
import Analytics from "./Analytics";
import jsPDF from "jspdf"; // Import jspdf library for PDF generation
import moment from "moment/moment";
import logoImg from "../../assets/logo-120x120.png"
import logoImg2 from "../../assets/jk logo-long.png"

const Home = () => {
  const navigate = useNavigate();

  const toastOptions = {
    position: "bottom-right",
    autoClose: 2000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: false,
    draggable: true,
    progress: undefined,
    theme: "dark",
  };
  const [cUser, setcUser] = useState();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [refresh, setRefresh] = useState(false);
  const [frequency, setFrequency] = useState("7");
  const [type, setType] = useState("all");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [view, setView] = useState("table");

  const handleStartChange = (date) => {
    setStartDate(date);
  };

  const handleEndChange = (date) => {
    setEndDate(date);
  };

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const generatePDFReport = () => {
    const doc = new jsPDF();
    const formattedStartDate = moment(startDate).format("YYYY-MM-DD");
    const formattedEndDate = moment(endDate).format("YYYY-MM-DD");
    let yOffset = 10;
  
    const transactionsPerPage = 5; // Number of transactions per page
    let currentPage = 1;
    let remainingTransactions = transactions.slice();
  
    // Function to add a new page and update yOffset
    const addNewPage = () => {
      doc.addPage();
      yOffset = 10; // Reset yOffset for new page
      currentPage++; // Increment current page count
    };
  
    // Function to check if a new page needs to be added
    const checkForNewPage = () => {
      if (yOffset + 50 > doc.internal.pageSize.height) { // Adjust this threshold as needed
        addNewPage();
      }
    };
  
    // Create a new Image object for the logo
    const logo1 = new Image();
    logo1.src = logoImg;
  
    // Add the first logo to the PDF document when it's loaded
    logo1.onload = function () {
      doc.addImage(logo1, "PNG", 10, 10, 20, 20); // Adjust position and size as needed
      // Add the second logo after the first one is added
      const logo2 = new Image();
      logo2.src = logoImg2; // Use the same image for demonstration
  
      logo2.onload = function () {
        doc.addImage(logo2, "PNG", 100, 10, 80, 15); // Adjust position and size as needed
        // Once both images are added, proceed with adding text and other content
        yOffset += 30;
        doc.text("Transaction Report", 10, yOffset);
        yOffset += 10;
        // doc.text(`Date Range: ${formattedStartDate} to ${formattedEndDate}`, 10, yOffset);
        const dateRangeText = startDate && endDate
          ? `Date Range: ${formattedStartDate} to ${formattedEndDate}`
          : `Date: ${moment().format("YYYY-MM-DD")}`;
  
        doc.text(dateRangeText, 10, yOffset);
  
        yOffset += 15;
  
        // Define column widths and header labels
        const columnWidths = [30, 40, 35, 37, 40]; // Adjust column widths as needed
        const headers = ["Date", "Title", "Amount", "Description", "Category"];
  
        // Draw table headers
        for (let i = 0; i < headers.length; i++) {
          doc.text(headers[i], 10 + (i * columnWidths[i]), yOffset);
        }
  
        doc.setLineWidth(0.1);
        doc.line(10, yOffset + 5, 10 + headers.length * columnWidths.reduce((acc, curr) => acc + curr), yOffset + 5);
  
        yOffset += 10;
  
        remainingTransactions.forEach((transaction) => {
          checkForNewPage();
          const { title, amount, description, category, date } = transaction;
          const formattedDate = moment(date).format("YYYY-MM-DD");
          doc.text(formattedDate, 10, yOffset);
          doc.text(title, 18 + columnWidths[0], yOffset);
          doc.text(`${amount.toString()}`, 15 + columnWidths[0] + columnWidths[1], yOffset);
  
          // Handle description text that may wrap to the next line
          const descriptionLines = doc.splitTextToSize(description, columnWidths[2]);
          doc.text(descriptionLines, 45 + columnWidths[0] + columnWidths[1], yOffset);
  
          doc.text(category, 30 + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3], yOffset);
          yOffset += (descriptionLines.length * 10); // Move to next row based on the number of lines in description
        });
  
        // Save the document with an appropriate name
        doc.save("expense_report.pdf");
      };
    };
  };
  
  useEffect(() => {
    const avatarFunc = async () => {
      if (localStorage.getItem("user")) {
        const user = JSON.parse(localStorage.getItem("user"));

        if (user.isAvatarImageSet === false || user.avatarImage === "") {
          navigate("/setAvatar");
        }
        setcUser(user);
        setRefresh(true);
      } else {
        navigate("/login");
      }
    };

    avatarFunc();
  }, [navigate]);

  const [values, setValues] = useState({
    title: "",
    amount: "",
    description: "",
    category: "",
    date: "",
    transactionType: "",
  });

  const handleChange = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  const handleChangeFrequency = (e) => {
    setFrequency(e.target.value);
  };

  const handleSetType = (e) => {
    setType(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { title, amount, description, category, date, transactionType } =
      values;

    if (
      !title ||
      !amount ||
      !description ||
      !category ||
      !date ||
      !transactionType
    ) {
      toast.error("Please enter all the fields", toastOptions);
    }
    setLoading(true);

    const { data } = await axios.post(addTransaction, {
      title: title,
      amount: amount,
      description: description,
      category: category,
      date: date,
      transactionType: transactionType,
      userId: cUser._id,
    });

    if (data.success === true) {
      toast.success(data.message, toastOptions);
      handleClose();
      setRefresh(!refresh);
    } else {
      toast.error(data.message, toastOptions);
    }

    setLoading(false);
  };

  const handleReset = () => {
    setType("all");
    setStartDate(null);
    setEndDate(null);
    setFrequency("7");
  };

  useEffect(() => {
    const fetchAllTransactions = async () => {
      try {
        setLoading(true);
        console.log(cUser._id, frequency, startDate, endDate, type);
        const { data } = await axios.post(getTransactions, {
          userId: cUser._id,
          frequency: frequency,
          startDate: startDate,
          endDate: endDate,
          type: type,
        });
        console.log(data);

        setTransactions(data.transactions);

        setLoading(false);
      } catch (err) {
        // toast.error("Error please Try again...", toastOptions);
        setLoading(false);
      }
    };

    fetchAllTransactions();
  }, [refresh, frequency, endDate, type, startDate]);

  const handleTableClick = (e) => {
    setView("table");
  };

  const handleChartClick = (e) => {
    setView("chart");
  };

  return (
    <>
      <Header />

      {loading ? (
        <>
          <Spinner />
        </>
      ) : (
        <>
          <Container
            style={{ position: "relative", zIndex: "2 !important" }}
            className="mt-3"
          >
            <div className="filterRow">
              <div className="text-white">
                <Form.Group className="mb-3" controlId="formSelectFrequency">
                  <Form.Label>Select Frequency</Form.Label>
                  <Form.Select
                    name="frequency"
                    value={frequency}
                    onChange={handleChangeFrequency}
                  >
                    <option value="7">Last Week</option>
                    <option value="30">Last Month</option>
                    <option value="365">Last Year</option>
                    <option value="custom">Custom</option>
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="text-white type">
                <Form.Group className="mb-3" controlId="formSelectFrequency">
                  <Form.Label>Type</Form.Label>
                  <Form.Select
                    name="type"
                    value={type}
                    onChange={handleSetType}
                  >
                    <option value="all">All</option>
                    <option value="expense">Expense</option>
                    <option value="credit">Earned</option>
                  </Form.Select>
                </Form.Group>
              </div>

              <div className="text-white iconBtnBox">
                <FormatListBulletedIcon
                  sx={{ cursor: "pointer" }}
                  onClick={handleTableClick}
                  className={`${view === "table" ? "iconActive" : "iconDeactive"
                    }`}
                />
                <BarChartIcon
                  sx={{ cursor: "pointer" }}
                  onClick={handleChartClick}
                  className={`${view === "chart" ? "iconActive" : "iconDeactive"
                    }`}
                />
              </div>

              <div>
                <Button onClick={handleShow} className="addNew">
                  Add New
                </Button>
                <Button onClick={handleShow} className="mobileBtn">
                  +
                </Button>
                <Modal show={show} onHide={handleClose} centered>
                  <Modal.Header closeButton>
                    <Modal.Title>Add Transaction Details</Modal.Title>
                  </Modal.Header>
                  <Modal.Body>
                    <Form>
                      <Form.Group className="mb-3" controlId="formName">
                        <Form.Label>Title</Form.Label>
                        <Form.Control
                          name="title"
                          type="text"
                          placeholder="Enter Transaction Name"
                          value={values.name}
                          onChange={handleChange}
                        />
                      </Form.Group>

                      <Form.Group className="mb-3" controlId="formAmount">
                        <Form.Label>Amount</Form.Label>
                        <Form.Control
                          name="amount"
                          type="number"
                          placeholder="Enter your Amount"
                          value={values.amount}
                          onChange={handleChange}
                        />
                      </Form.Group>

                      <Form.Group className="mb-3" controlId="formSelect">
                        <Form.Label>Category</Form.Label>
                        <Form.Select
                          name="category"
                          value={values.category}
                          onChange={handleChange}
                        >
                          <option value="">Choose...</option>
                          <option value="Groceries">Groceries</option>
                          <option value="Rent">Rent</option>
                          <option value="Salary">Salary</option>
                          <option value="Tip">Tip</option>
                          <option value="Food">Food</option>
                          <option value="Medical">Medical</option>
                          <option value="Utilities">Utilities</option>
                          <option value="Entertainment">Entertainment</option>
                          <option value="Transportation">Transportation</option>
                          <option value="Other">Other</option>
                        </Form.Select>
                      </Form.Group>

                      <Form.Group className="mb-3" controlId="formDescription">
                        <Form.Label>Description</Form.Label>
                        <Form.Control
                          type="text"
                          name="description"
                          placeholder="Enter Description"
                          value={values.description}
                          onChange={handleChange}
                        />
                      </Form.Group>

                      <Form.Group className="mb-3" controlId="formSelect1">
                        <Form.Label>Transaction Type</Form.Label>
                        <Form.Select
                          name="transactionType"
                          value={values.transactionType}
                          onChange={handleChange}
                        >
                          <option value="">Choose...</option>
                          <option value="credit">Credit</option>
                          <option value="expense">Expense</option>
                        </Form.Select>
                      </Form.Group>

                      <Form.Group className="mb-3" controlId="formDate">
                        <Form.Label>Date</Form.Label>
                        <Form.Control
                          type="date"
                          name="date"
                          value={values.date}
                          onChange={handleChange}
                        />
                      </Form.Group>

                      {/* Add more form inputs as needed */}
                    </Form>
                  </Modal.Body>
                  <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                      Close
                    </Button>
                    <Button variant="primary" onClick={handleSubmit}>
                      Submit
                    </Button>
                  </Modal.Footer>
                </Modal>
              </div>
            </div>
            <br style={{ color: "white" }}></br>

            {frequency === "custom" ? (
              <>
                <div className="date">
                  <div className="form-group">
                    <label htmlFor="startDate" className="text-white">
                      Start Date:
                    </label>
                    <div>
                      <DatePicker
                        selected={startDate}
                        onChange={handleStartChange}
                        selectsStart
                        startDate={startDate}
                        endDate={endDate}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="endDate" className="text-white">
                      End Date:
                    </label>
                    <div>
                      <DatePicker
                        selected={endDate}
                        onChange={handleEndChange}
                        selectsEnd
                        startDate={startDate}
                        endDate={endDate}
                        minDate={startDate}
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <></>
            )}

            <div className="containerBtn">
              <Button variant="primary" onClick={handleReset}>
                Reset Filter
              </Button>
            </div>

            <div className="containerBtn">
              <Button variant="primary" onClick={generatePDFReport}>
                Generate PDF Report
              </Button>
            </div>
            {view === "table" ? (
              <>
                <TableData data={transactions} user={cUser} />
              </>
            ) : (
              <>
                <Analytics transactions={transactions} user={cUser} />
              </>
            )}
            <ToastContainer />
          </Container>
        </>
      )}
    </>
  );
};

export default Home;
