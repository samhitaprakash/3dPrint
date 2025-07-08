
import * as THREE from './three.module.js';
import { STLLoader } from './STLLoader.js';
import { OrbitControls } from './OrbitControls.js';

// === File Upload Elements ===
const uploadBtn = document.getElementById("uploadTrigger");
const fileInput = document.getElementById("fileUpload");
const previewDiv = document.getElementById("previewCanvas");
const orderOptionsSection = document.getElementById("orderOptions");
const loadingOverlay = document.getElementById("loaderOverlay");
const quantityInput = document.getElementById("quantityInput");
const priceValueSpan = document.getElementById("priceValue");

// === Rate Maps ===
const materialRates = {
  "9600 Resin": 12,
  "Black Resin": 12,
  "Imagine Black": 14,
  "Grey Resin": 11,
  "8001 Resin": 15
};

const techRates = {
  "SLA(Resin)": 20,
  "MJF(Nylon)": 25,
  "SLM(Metal)": 40,
  "FDM(Plastic)": 10,
  "SLS(Nylon)": 22,
  "WJP(Resin)": 30
};

const colorRates = {
  "Matte White": 5,
  "Grey": 5,
  "Black": 6
};

const finishRate = 8;

// === Modal Logic ===
const modal = document.getElementById("fileModal");
const trigger = document.querySelector(".modal-trigger");
const closeBtn = document.querySelector(".modal .close");

if (trigger && closeBtn) {
  trigger.onclick = () => (modal.style.display = "block");
  closeBtn.onclick = () => (modal.style.display = "none");
  window.onclick = (e) => {
    if (e.target === modal) modal.style.display = "none";
  };
}

// === Scene Setup ===
let scene, camera, renderer, mesh, controls;

// === Trigger Upload ===
uploadBtn.addEventListener("click", () => fileInput.click());

// === Handle Upload ===
let fileUploaded = false;
fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file || !file.name.toLowerCase().endsWith(".stl")) {
    alert("Please upload a valid .stl file.");
    return;
  }
  fileUploaded = true;
  loadingOverlay.classList.add("show");
  document.getElementById("modelInfoSection").style.display = "block";
  orderOptionsSection.style.display = "block";

  const reader = new FileReader();
  reader.onload = function (event) {
    renderSTL(event.target.result);
    setTimeout(() => loadingOverlay.classList.remove("show"), 1500);
  };
  reader.readAsArrayBuffer(file);
});

function getSelectedUnit() {
  const selected = document.querySelector('input[name="unit"]:checked');
  return selected ? selected.value : 'mm';
}

function convertDimensions(size, unit) {
  if (unit === 'inch') {
    return {
      x: (size.x / 25.4).toFixed(2),
      y: (size.y / 25.4).toFixed(2),
      z: (size.z / 25.4).toFixed(2)
    };
  } else {
    return {
      x: (size.x / 10).toFixed(2),
      y: (size.y / 10).toFixed(2),
      z: (size.z / 10).toFixed(2)
    };
  }
}

function convertVolume(volume, unit) {
  return unit === 'inch' ? (volume / 16387.064).toFixed(2) : (volume / 1000).toFixed(2);
}

function updateMaterialStats(geometry) {
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  if (!geometry.boundingBox) {
  console.error("⚠️ Bounding box not computed!");
  return;
}

  const size = geometry.boundingBox.getSize(new THREE.Vector3());
  const unit = getSelectedUnit();
  const dimensions = convertDimensions(size, unit);

  const unitLabel = unit === 'inch' ? 'in' : 'cm';

const dimText = `${dimensions.x} × ${dimensions.y} × ${dimensions.z} ${unitLabel}`;
console.log("✅ Dimensions:", dimText);

const dimensionCell = document.getElementById("dimensionCell");
if (dimensionCell) {
  dimensionCell.textContent = dimText;
} else {
  console.warn("❗ Element with ID 'dimensionCell' not found");
}

  const rawVolume = calculateMeshVolume(geometry);
  const volumeInCm3 = rawVolume / 1000; // Always use this for price

  const displayVolume = unit === 'inch'
  ? (rawVolume / 16387.064).toFixed(2)
  : volumeInCm3.toFixed(2);

  const volumeLabel = unit === 'inch' ? 'in³' : 'cm³';
  document.getElementById("volumeCell").textContent = `${displayVolume} ${volumeLabel}`;

 // always in cm³


  const printMinutes = unit === 'inch' ? volumeInCm3 * 25 : volumeInCm3 * 10;
  const hours = String(Math.floor(printMinutes / 60)).padStart(2, '0');
  const minutes = String(Math.floor(printMinutes % 60)).padStart(2, '0');
  document.getElementById("printTimeCell").textContent = `${hours}:${minutes}:00`;

  calculateAndDisplayPrice(volumeInCm3);
}

function calculateAndDisplayPrice(volume) {
  console.log("📌 Price function called", volume); 
  
  const selectedMaterial = document.querySelector(".material-options .btn.selected")?.dataset.material;
  const selectedTech = document.querySelector(".tech-options .btn.selected")?.dataset.tech;
  const selectedColor = document.querySelector(".color-options .btn.selected")?.dataset.color;
  const surfaceFinish = document.querySelector(".surface-toggle.btn.selected")?.dataset.value === "yes";
  const quantity = parseInt(quantityInput?.value || 1);
  
  let base = 0;
  let base2 = 100;

  if (selectedMaterial && materialRates[selectedMaterial]) base += materialRates[selectedMaterial];
  if (selectedTech && techRates[selectedTech]) base += techRates[selectedTech];
  if (selectedColor && colorRates[selectedColor]) base += colorRates[selectedColor];
  if (surfaceFinish) base += finishRate;
  
  const price = base2 +(  base * volume * quantity);

  console.log("🔍 Base:", base);
  console.log("🧪 Qty:", quantity);
  console.log("💰 Final Price:", price);

  priceValueSpan.textContent = `₹${price.toFixed(2)}`;
}
 
// Event listeners for live price update
['.material-options .btn', '.tech-options .btn', '.color-options .btn', '.surface-toggle'].forEach(selector => {
  document.querySelectorAll(selector).forEach(btn => {
    btn.addEventListener("click", () => {
      btn.parentElement.querySelectorAll(".btn").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      if (window.latestGeometry) updateMaterialStats(window.latestGeometry);
    });
  });
});

quantityInput?.addEventListener("input", () => {
  if (window.latestGeometry) updateMaterialStats(window.latestGeometry);
});


function calculateMeshVolume(geometry) {
  // Basic approximation using triangle mesh (for non-manifold models this may be off)
  let position = geometry.attributes.position;
  let sum = 0;
  let p1 = new THREE.Vector3(), p2 = new THREE.Vector3(), p3 = new THREE.Vector3();
  for (let i = 0; i < position.count; i += 3) {
    p1.fromBufferAttribute(position, i);
    p2.fromBufferAttribute(position, i + 1);
    p3.fromBufferAttribute(position, i + 2);
    sum += signedVolumeOfTriangle(p1, p2, p3);
  }
  return Math.abs(sum);
}

function signedVolumeOfTriangle(p1, p2, p3) {
  return p1.dot(p2.cross(p3)) / 6.0;
}
// INITSCENE
function initScene() {
  if (renderer) {
    previewDiv.innerHTML = "";
  }

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0f0); // light gray

  const aspect = previewDiv.clientWidth / previewDiv.clientHeight;
  const frustumSize = 150;

  camera = new THREE.OrthographicCamera(
    (frustumSize * aspect) / -2, 
    (frustumSize * aspect) / 2,
    frustumSize / 2, 
    frustumSize / -2,
    0.1, 2000
  );
  camera.position.set(100, 100, 100);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(previewDiv.clientWidth, previewDiv.clientHeight);
  previewDiv.appendChild(renderer.domElement);

  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x888888, 1.2);
  scene.add(hemiLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
  directionalLight.position.set(100, 100, 100);
  scene.add(directionalLight);
}

// RENDER
function renderSTL(arrayBuffer) {
  initScene();

  const loader = new STLLoader();
  const geometry = loader.parse(arrayBuffer);
  window.latestGeometry = geometry;

  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();

  const center = geometry.boundingBox.getCenter(new THREE.Vector3());
  const size = geometry.boundingBox.getSize(new THREE.Vector3());

  const material = new THREE.MeshStandardMaterial({
    color: 0x444444,
    metalness: 0.1,
    roughness: 0.7,
    flatShading: true
  });

  const mesh = new THREE.Mesh(geometry, material);
  window.currentMesh = mesh;
  mesh.geometry.translate(-center.x, -center.y, -center.z);
  mesh.rotation.x = -Math.PI / 2;
  scene.add(mesh);

  window.latestGeometry = geometry;
  updateMaterialStats(geometry);

  const floorSize = Math.ceil(Math.max(size.x, size.y, size.z) * 3);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(64, 0); ctx.lineTo(64, 128);
  ctx.moveTo(0, 64); ctx.lineTo(128, 64);
  ctx.stroke();
  const gridTexture = new THREE.CanvasTexture(canvas);
  gridTexture.wrapS = gridTexture.wrapT = THREE.RepeatWrapping;
  gridTexture.repeat.set(floorSize / 20, floorSize / 20);

  const floorMat = new THREE.MeshStandardMaterial({
    map: gridTexture,
    transparent: true,
    opacity: 0.8,
    side: THREE.DoubleSide
  });

  const floorGeo = new THREE.PlaneGeometry(floorSize, floorSize);
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -size.z / 2;
  scene.add(floor);

  const boxHelper = new THREE.BoxHelper(mesh, 0x33aaff);
  scene.add(boxHelper);

  const expandedSize = size.clone().multiplyScalar(1.4);
  const boxGeo = new THREE.BoxGeometry(expandedSize.x, expandedSize.y, expandedSize.z);
  const boxMat = new THREE.MeshBasicMaterial({
    color: 0x33aaff,
    wireframe: true,
    transparent: true,
    opacity: 0.8
  });

  const axesHelper = new THREE.AxesHelper(Math.max(size.x, size.y, size.z));
  scene.add(axesHelper);

  const boundingRadius = geometry.boundingSphere.radius;
  const camDist = boundingRadius * 2.8;
  camera.position.set(camDist, camDist, camDist);
  camera.lookAt(0, 0, 0);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.1;
  controls.enablePan = true;
  controls.minDistance = boundingRadius * 0.5;
  controls.maxDistance = boundingRadius * 5;


  function animate() {
    requestAnimationFrame(animate);
    boxHelper.update();
    controls.update();
    renderer.render(scene, camera);
  }

  animate();
}

document.querySelectorAll('input[name="unit"]').forEach(radio => {
  radio.addEventListener('change', () => {
    if (window.latestGeometry) updateMaterialStats(window.latestGeometry);
  });
});

document.querySelector('.rotation-x').addEventListener('input', (e) => {
  if (window.currentMesh) {
    window.currentMesh.rotation.x = THREE.MathUtils.degToRad(Number(e.target.value));
  }
});

document.querySelector('.rotation-y').addEventListener('input', (e) => {
  if (window.currentMesh) {
    window.currentMesh.rotation.y = THREE.MathUtils.degToRad(Number(e.target.value));
  }
});



window.resetRotation = function () {
  if (window.currentMesh) {
    window.currentMesh.rotation.set(0, 0, 0);
    document.querySelector('.rotation-x').value = 0;
    document.querySelector('.rotation-y').value = 0;
    controls.update();
    renderer.render(scene, camera);
  }
};


// === Handle Window Resize ===
window.addEventListener("resize", () => {
  if (camera && renderer) {
    camera.aspect = previewDiv.clientWidth / previewDiv.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(previewDiv.clientWidth, previewDiv.clientHeight);
  }
});

// === Store Selected Order Options ===
const orderOptions = {
  tech: null,
  material: null,
  color: null,
};

// === Setup Option Selection Buttons ===
function setupOptionGroup(groupClass, key) {
  const buttons = document.querySelectorAll(`.${groupClass} button`);
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      orderOptions[key] = btn.dataset[key];
    });
  });
}

setupOptionGroup("tech-options", "tech");
setupOptionGroup("material-options", "material");
setupOptionGroup("color-options", "color");


// === UI Toggle Logic After DOM Loads ===
document.addEventListener("DOMContentLoaded", () => {
  // === Expand/Collapse Customize Section ===
  const toggleBtn = document.getElementById("toggleCustomize");
  const toggleText = document.getElementById("toggleText");
  const arrow = document.getElementById("arrow");

  toggleBtn.addEventListener("click", () => {
    const isVisible = orderOptionsSection.style.display === "block";
    orderOptionsSection.style.display = isVisible ? "none" : "block";
    toggleText.textContent = isVisible ? "Expand" : "Collapse";
    
    
  arrow.classList.toggle("rotate", !isVisible);
  });

  // === Surface Finish Toggle Logic ===
  const surfaceButtons = document.querySelectorAll(".surface-toggle");

  surfaceButtons.forEach(button => {
    button.addEventListener('click', () => {
      const surfaceSection = document.querySelector(".surface-section");
      const value = button.dataset.value;

      console.log("Button Clicked:", value);
      console.log("Found section:", surfaceSection);

      surfaceButtons.forEach(btn => btn.classList.remove('selected'));
      button.classList.add('selected');

      if (value === 'yes') {
        surfaceSection?.classList.remove('hidden');
      } else {
        surfaceSection?.classList.add('hidden');
      }
    });
  });
});

 // === Toggle Remark Text Area ===
  const remarkToggle = document.querySelector(".toggle-remark");
  const remarkBox = document.getElementById("remarkTextarea");

  remarkToggle.addEventListener("click", () => {
    const isVisible = remarkBox.style.display === "block";
    remarkBox.style.display = isVisible ? "none" : "block";
  });

// === Add to Cart Completed ===
const addToCartBtn = document.querySelector('.add-to-cart');
const toast = document.getElementById('toast');

addToCartBtn.addEventListener('click', async () => {
  if (!fileUploaded) {
    alert("Please upload a 3D model before adding to cart.");
    return;
  }

  if (!orderOptions.tech || !orderOptions.material || !orderOptions.color) {
    alert("Please select all options before adding to cart.");
    return;
  }

  const order = {
    tech: orderOptions.tech,
    material: orderOptions.material,
    color: orderOptions.color,
    remarks: document.getElementById('remarkTextarea')?.value || '',
    date: new Date().toISOString()
  };

  console.log('🛒 Order simulated:', order);

  // Animate button + toast
  addToCartBtn.classList.add('clicked');
  showToast(" Added to cart");
  

  setTimeout(() => {
    addToCartBtn.classList.remove('clicked');
    toast.classList.remove('show');
  }, 3000);
});

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.innerHTML = `<i class="fa-solid fa-circle-check" style="margin-right: 8px;"></i>${message}`;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// ===Order Now ===
const orderNowBtn = document.getElementById('orderNowBtn');

orderNowBtn.addEventListener('click', async () => {
  if (!fileUploaded) {
    alert("Please upload a 3D model before ordering.");
    return;
  }

  const technology = document.querySelector(".tech-options .btn.selected")?.dataset.tech;
  const material = document.querySelector(".material-options .btn.selected")?.dataset.material;
  const color = document.querySelector(".color-options .btn.selected")?.dataset.color;
  const surfaceFinish = document.querySelector(".surface-toggle.btn.selected")?.dataset.value === "yes";
  const finishType = document.getElementById("finishType")?.value || "";
  const generalSanding = document.querySelector('input[type="checkbox"]')?.checked || false;
  const quantity = parseInt(document.getElementById("quantityInput")?.value || 1);
  const productDesc = document.querySelector('select')?.value || "";
  const price = priceValueSpan.textContent.replace(/[^\d.]/g, ""); // Remove ₹
  const remarks = document.getElementById("remarkTextarea")?.value || "";
  const uploadedFile = fileInput?.files[0]?.name || "";

  if (!technology || !material || !color) {
    alert("Please select all options before ordering.");
    return;
  }

  const orderPayload = {
    technology,
    material,
    color,
    surfaceFinish,
    finishType,
    generalSanding,
    quantity,
    productDesc,
    price,
    remarks,
    uploadedFile,
  };

  try {
    const response = await fetch("https://threed-print-backend.onrender.com/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderPayload),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log("Server responded:", data);
      console.log("🔍 data.order =", data.order);
      console.log("🔍 data.order._id =", data.order?._id);

      const orderId = data.order?._id || "N/A";
      alert(" Order placed successfully!\nOrder ID: " + data.order._id);
      showToast("Order placed successfully");
    } else {
      alert("❌ Failed to place order.");
      console.error(data);
    }
  } catch (err) {
    console.error("❌ Error placing order:", err);
    alert("Server error. Please try again.");
  }
});

// ===OrderHistory===

window.fetchOrderHistory = async function () {
  console.log("🧠 Order history clicked");
  try {
    const res = await fetch("https://threed-print-backend.onrender.com/api/orders");
    const data = await res.json();

    const container = document.getElementById("orderHistoryList");
    container.innerHTML = ""; // Clear old content

    if (data.length === 0) {
      container.innerHTML = "<p>No past orders found.</p>";
      return;
    }

    data.forEach(order => {
      const div = document.createElement("div");
      div.classList.add("order-card");
      div.innerHTML = `
        <h3>Order ID: ${order._id}</h3>
        <p><strong>Technology:</strong> ${order.technology}</p>
        <p><strong>Material:</strong> ${order.material}</p>
        <p><strong>Color:</strong> ${order.color}</p>
        <p><strong>Qty:</strong> ${order.quantity}</p>
        <p><strong>Remarks:</strong> ${order.remarks || "None"}</p>
      `;
      container.appendChild(div);
    });

  } catch (err) {
    console.error("❌ Failed to load order history", err);
  }
}

document.getElementById('toggleHistoryBtn').addEventListener('click', () => {
  const section = document.getElementById('orderHistorySection');
  const btn = document.getElementById('toggleHistoryBtn');

  if (section.style.display === 'none') {
    section.style.display = 'block';
    btn.textContent = 'Hide Order History';
    fetchOrderHistory(); // fetch only when opening
  } else {
    section.style.display = 'none';
    btn.textContent = 'View Order History';
  }
});
