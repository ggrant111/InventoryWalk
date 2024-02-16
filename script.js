// Global variables
let globalData = [];
let currentStatusFilter = "All";
let currentVehicleStatusFilter = "All";
let additionalInventory = []; // Global variable to store additional inventory

async function fetchInventoryData() {
  try {
    const response = await fetch("inventory.json");
    additionalInventory = await response.json();
    // Assume globalData has already been fetched and processed
    applyFilters(); // Update the UI with the new inventory data available
  } catch (error) {
    console.error("Error loading the inventory JSON file:", error);
  }
}

// Fetch and process data
async function fetchData() {
  try {
    const response = await fetch("data.json");
    const data = await response.json();
    globalData = sortDataByStatus(data); // Store and sort fetched data globally

    // Move the calculation of counts here, right after globalData is set
    const statusCounts = calculateFilterCounts(globalData, "Status");
    const vehicleStatusCounts = calculateFilterCounts(
      globalData,
      "Vehicle Status"
    );

    // Now generate the navbar with the updated counts
    const statusFilters = ["All", ...new Set(data.map((item) => item.Status))];
    const vehicleStatusFilters = [
      "All",
      "In Inventory",
      "Sold or Traded",
      "Never in Inventory",
    ];
    generateNavbar(
      statusFilters,
      vehicleStatusFilters,
      statusCounts,
      vehicleStatusCounts
    );

    applyFilters(); // Initially apply filters to show all data
  } catch (error) {
    console.error("Error loading the JSON file:", error);
  }
}

function sortDataByStatus(data) {
  // Define the order for vehicle status
  const statusOrder = ["In Inventory", "Sold or Traded", "Never in Inventory"];
  return data.sort(
    (a, b) =>
      statusOrder.indexOf(a["Vehicle Status"]) -
      statusOrder.indexOf(b["Vehicle Status"])
  );
}

function generateNavbar(
  statusFilters,
  vehicleStatusFilters,
  statusCounts,
  vehicleStatusCounts
) {
  const navbar = document.getElementById("navbar");
  navbar.innerHTML = ""; // Clear existing navbar items

  // "Status" filters
  navbar.appendChild(document.createTextNode("Status:"));
  statusFilters.forEach((filter) => {
    const link = createFilterLink(filter, "status", statusCounts[filter] || 0);
    navbar.appendChild(link);
  });

  // "Vehicle Status" filters
  navbar.appendChild(document.createTextNode("Vehicle Status:"));
  vehicleStatusFilters.forEach((filter) => {
    const link = createFilterLink(
      filter,
      "vehicleStatus",
      vehicleStatusCounts[filter] || 0
    );
    navbar.appendChild(link);
  });

  // Adjusted to include counts in the link text
  function createFilterLink(filter, type, count) {
    const link = document.createElement("a");
    link.innerText = `${filter} (${count})`; // Display the count next to the filter
    link.href = "#";
    link.dataset.type = type;
    link.addEventListener("click", function () {
      if (type === "status") {
        currentStatusFilter = filter;
      } else if (type === "vehicleStatus") {
        currentVehicleStatusFilter = filter;
      }
      applyFilters();
    });
    return link;
  }
}

// Adjust your call to generateNavbar to include the counts

function calculateFilterCounts(data, filterType) {
  const counts = { All: data.length };
  data.forEach((item) => {
    const value = item[filterType];
    if (counts[value]) {
      counts[value]++;
    } else {
      counts[value] = 1;
    }
  });
  return counts;
}

// Example usage for "Status" and "Vehicle Status" filters
const statusCounts = calculateFilterCounts(globalData, "Status");
const vehicleStatusCounts = calculateFilterCounts(globalData, "Vehicle Status");

function applyFilters() {
  const filteredData = globalData.filter((record) => {
    const statusMatch =
      currentStatusFilter === "All" || record.Status === currentStatusFilter;
    const vehicleStatusMatch =
      currentVehicleStatusFilter === "All" ||
      record["Vehicle Status"] === currentVehicleStatusFilter;
    return statusMatch && vehicleStatusMatch;
  });

  displayCards(filteredData);
  highlightSelectedFilters(); // Call this function to highlight filters after applying them
}

function highlightSelectedFilters() {
  // Highlight the selected filters
  document.querySelectorAll("#navbar a").forEach((link) => {
    // Remove 'selected' class from all filters
    link.classList.remove("selected");

    // Add 'selected' class based on current filters
    if (
      (link.dataset.type === "status" &&
        link.innerText.includes(currentStatusFilter)) ||
      (link.dataset.type === "vehicleStatus" &&
        link.innerText.includes(currentVehicleStatusFilter))
    ) {
      link.classList.add("selected");
    }
  });
}

function displayCards(data) {
  const container = document.getElementById("card-container");
  container.innerHTML = ""; // Clear existing cards
  data.forEach((record) => {
    const card = document.createElement("div");
    card.className = "card";
    // Apply background color based on Vehicle Status
    applyStatusColor(card, record["Vehicle Status"]);

    Object.entries(record).forEach(([key, value]) => {
      const element = document.createElement("div");
      element.className = "container";
      element.innerHTML = `<div class="card-key">${key}:</div><div class="card-value">${value}</div>`;
      card.appendChild(element);
    });
    container.appendChild(card);
    // Find matching inventory items
    const matchingInventory = findMatchingInventory(record);
    if (matchingInventory.length > 0) {
      const badge = document.createElement("span");
      badge.className = "inventory-badge";
      badge.innerText = `${matchingInventory.length}`;
      badge.onclick = () => displayModal(matchingInventory); // Function to display modal with suggestions
      card.appendChild(badge);
    }

    container.appendChild(card);
  });
}

function findMatchingInventory(record) {
  return additionalInventory.filter((item) => {
    const yearDifference = Math.abs(item.Year - record.Year);

    // Ensure Price is treated as a number, regardless of its initial type
    const itemPrice =
      typeof item.Price === "string"
        ? parseFloat(item.Price.replace(/[^\d.]/g, ""))
        : item.Price;
    const recordPrice =
      typeof record.Price === "string"
        ? parseFloat(record.Price.replace(/[^\d.]/g, ""))
        : record.Price;
    const priceDifference = Math.abs(itemPrice - recordPrice);

    return yearDifference <= 1 && priceDifference <= 3000;
  });
}

function applyStatusColor(card, status) {
  if (status === "In Inventory") {
    card.classList.add("card-in-inventory");
  } else if (status === "Sold or Traded") {
    card.classList.add("card-sold");
  } else if (status === "Never in Inventory") {
    card.classList.add("card-never-in-inventory");
  }
}

function filterCardsByStatus(selectedFilter, selectedElement) {
  // No need to fetch data again; use globalData for filtering
  const filteredData = globalData.filter((record) => {
    const vehicleStatus = record["Vehicle Status"];
    return (
      selectedFilter === "All" ||
      record.Status === selectedFilter ||
      vehicleStatus === selectedFilter ||
      (selectedFilter === "Sold or Traded" &&
        (vehicleStatus === "Sold" || vehicleStatus === "Traded"))
    );
  });

  displayCards(filteredData); // Display only filtered data

  // Highlight the selected filter in the navbar
  const navbarLinks = document.querySelectorAll("#navbar a");
  navbarLinks.forEach((link) => link.classList.remove("selected"));
  selectedElement.classList.add("selected");
}

function displayModal(matchingInventory) {
  const modal = document.getElementById("inventoryModal");
  const modalContent = document.getElementById("modalContent");
  modalContent.innerHTML = "<h1>Suggested Vehicles</h1>"; // Clear previous content

  matchingInventory.forEach((item) => {
    const itemElement = document.createElement("div");
    itemElement.innerHTML = `
            <h4>${item["N/U/T"]} ${item.Year} ${item.Make} ${item.Model} </h4>
            <p>Stock #: ${item["Stock#"]}</p>
            <p>Price: $${item.Price}</p>
            <p>Trim: ${item.Trim}</p>
            <p>Color: ${item["Ext. Color"]}</p>
            <p>Miles: ${item.Miles}</p>
        `;
    modalContent.appendChild(itemElement);
  });

  modal.style.display = "block"; // Show the modal
}

async function initializeApp() {
  await fetchData(); // Fetch main data and generate navbar
  await fetchInventoryData(); // Fetch additional inventory data
  applyFilters(); // Apply filters and update UI based on fetched data
}

initializeApp(); // This replaces direct calls to fetchData() and fetchInventoryData()
