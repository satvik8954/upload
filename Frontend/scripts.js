const API_BASE_URL = "http://localhost:8000";

function initUploadForm() {
  const form = document.getElementById("uploadForm");
  const fileInput = document.getElementById("fileInput");
  const postContent = document.getElementById("postContent");
  const charCount = document.getElementById("charCount");
  const fileLabel = document.querySelector(".file-label");
  const filePreview = document.getElementById("filePreview");

  if (postContent) {
    postContent.addEventListener("input", function () {
      charCount.textContent = this.value.length;
    });
  }

  if (fileInput) {
    fileInput.addEventListener("change", handleFileSelect);

    fileLabel.addEventListener("dragover", (e) => {
      e.preventDefault();
      fileLabel.style.borderColor = "var(--primary)";
      fileLabel.style.background = "rgba(0, 212, 255, 0.15)";
    });

    fileLabel.addEventListener("dragleave", () => {
      fileLabel.style.borderColor = "rgba(0, 212, 255, 0.3)";
      fileLabel.style.background = "rgba(0, 212, 255, 0.05)";
    });

    fileLabel.addEventListener("drop", (e) => {
      e.preventDefault();
      fileInput.files = e.dataTransfer.files;
      handleFileSelect();
      fileLabel.style.borderColor = "rgba(0, 212, 255, 0.3)";
      fileLabel.style.background = "rgba(0, 212, 255, 0.05)";
    });
  }

  function handleFileSelect() {
    const file = fileInput.files[0];
    if (!file) return;

    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      showError("fileError", "File size must be less than 50MB");
      return;
    }

    filePreview.innerHTML = "";
    const previewItem = document.createElement("div");
    previewItem.className = "file-preview-item";

    if (file.type.startsWith("image/")) {
      const img = document.createElement("img");
      img.src = URL.createObjectURL(file);
      previewItem.appendChild(img);
    } else if (file.type.startsWith("video/")) {
      const video = document.createElement("video");
      video.src = URL.createObjectURL(file);
      previewItem.appendChild(video);
    }

    const removeBtn = document.createElement("button");
    removeBtn.className = "file-preview-remove";
    removeBtn.textContent = "×";
    removeBtn.type = "button";
    removeBtn.onclick = () => {
      fileInput.value = "";
      filePreview.innerHTML = "";
    };
    previewItem.appendChild(removeBtn);
    filePreview.appendChild(previewItem);
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      clearErrors();

      const userId = document.getElementById("userId").value.trim();
      const content = document.getElementById("postContent").value.trim();

      if (!userId) {
        showError("userIdError", "User ID is required");
        return;
      }

      if (!content) {
        showError("contentError", "Post content is required");
        return;
      }

      if (content.length > 500) {
        showError(
          "contentError",
          "Post content must be 500 characters or less"
        );
        return;
      }

      const file = fileInput.files[0];
      const formData = new FormData();
      formData.append("user_id", userId);
      formData.append("content", content);
      if (file) {
        formData.append("file", file);
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      const btnText = submitBtn.querySelector(".btn-text");
      const btnLoader = submitBtn.querySelector(".btn-loader");

      submitBtn.disabled = true;
      btnText.textContent = "Uploading...";
      btnLoader.classList.remove("hidden");

      try {
        const response = await fetch(`${API_BASE_URL}/upload`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.detail || "Upload failed");
        }

        form.reset();
        charCount.textContent = "0";
        filePreview.innerHTML = "";

        showSuccess();

        setTimeout(() => {
          document.getElementById("successMessage").classList.add("hidden");
        }, 5000);
      } catch (error) {
        showErrorAlert(error.message || "Failed to upload post");
      } finally {
        submitBtn.disabled = false;
        btnText.textContent = "Upload Post";
        btnLoader.classList.add("hidden");
      }
    });
  }
}

function showError(elementId, message) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = message;
  }
}

function clearErrors() {
  document.getElementById("userIdError").textContent = "";
  document.getElementById("contentError").textContent = "";
  document.getElementById("fileError").textContent = "";
  document.getElementById("errorAlert").classList.add("hidden");
}

function showSuccess() {
  const successMsg = document.getElementById("successMessage");
  if (successMsg) {
    successMsg.classList.remove("hidden");
  }
}

function showErrorAlert(message) {
  const errorAlert = document.getElementById("errorAlert");
  const errorText = document.getElementById("errorText");
  if (errorAlert) {
    errorText.textContent = message;
    errorAlert.classList.remove("hidden");
  }
}

async function loadDashboardData() {
  try {
    const [sentimentData, tagsData, postsData] = await Promise.all([
      fetchSentimentData(),
      fetchTrendingTags(),
      fetchRecentPosts(),
    ]);

    updateKPICards(sentimentData);
    renderSentimentChart(sentimentData);
    renderTrendingChart(tagsData);
    renderPosts(postsData);
  } catch (error) {
    console.error("Failed to load dashboard data:", error);
    showEmptyState();
  }
}

async function fetchSentimentData() {
  try {
    const response = await fetch(`${API_BASE_URL}/analytics/sentiment`);
    if (!response.ok) throw new Error("Failed to fetch sentiment data");
    return await response.json();
  } catch (error) {
    console.error("Sentiment fetch error:", error);
    return { positive: 0, neutral: 0, negative: 0 };
  }
}

async function fetchTrendingTags() {
  try {
    const response = await fetch(`${API_BASE_URL}/analytics/trending-tags`);
    if (!response.ok) throw new Error("Failed to fetch trending tags");
    return await response.json();
  } catch (error) {
    console.error("Trending tags fetch error:", error);
    return [];
  }
}

async function fetchRecentPosts() {
  try {
    const response = await fetch(`${API_BASE_URL}/analytics/recent-posts`);
    if (!response.ok) throw new Error("Failed to fetch recent posts");
    return await response.json();
  } catch (error) {
    console.error("Recent posts fetch error:", error);
    return [];
  }
}

function updateKPICards(sentimentData) {
  const positive = sentimentData.positive || 0;
  const neutral = sentimentData.neutral || 0;
  const negative = sentimentData.negative || 0;
  const total = positive + neutral + negative;

  animateValue("totalPosts", total);
  animateValue("positivePosts", positive);
  animateValue("neutralPosts", neutral);
  animateValue("negativePosts", negative);
}

function animateValue(elementId, endValue) {
  const element = document.getElementById(elementId);
  if (!element) return;

  let startValue = 0;
  const duration = 800;
  const startTime = Date.now();

  function update() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const currentValue = Math.floor(
      startValue + (endValue - startValue) * progress
    );
    element.textContent = currentValue;

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  update();
}

function renderSentimentChart(sentimentData) {
  const ctx = document.getElementById("sentimentChart");
  if (!ctx) return;

  const chartCtx = ctx.getContext("2d");

  new Chart(chartCtx, {
    type: "doughnut",
    data: {
      labels: ["Positive", "Neutral", "Negative"],
      datasets: [
        {
          data: [
            sentimentData.positive || 0,
            sentimentData.neutral || 0,
            sentimentData.negative || 0,
          ],
          backgroundColor: ["#00c853", "#7c8aff", "#ff3d5a"],
          borderColor: "#0a0a14",
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: "#b8b8d1",
            font: { size: 12, family: "Inter" },
            padding: 16,
          },
        },
      },
    },
  });
}

function renderTrendingChart(tagsData) {
  const ctx = document.getElementById("trendingChart");
  if (!ctx) return;

  const chartCtx = ctx.getContext("2d");
  const labels = tagsData.slice(0, 8).map((item) => item.tag || "");
  const data = tagsData.slice(0, 8).map((item) => item.count || 0);

  new Chart(chartCtx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Mentions",
          data: data,
          backgroundColor: "#00d4ff",
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        x: {
          grid: {
            color: "rgba(0, 212, 255, 0.1)",
          },
          ticks: {
            color: "#b8b8d1",
            font: { size: 12 },
          },
        },
        y: {
          grid: {
            display: false,
          },
          ticks: {
            color: "#b8b8d1",
            font: { size: 12 },
          },
        },
      },
    },
  });
}

function renderPosts(postsData) {
  const container = document.getElementById("postsContainer");
  if (!container) return;

  container.innerHTML = "";

  if (!postsData || postsData.length === 0) {
    showEmptyState();
    return;
  }

  postsData.forEach((post, index) => {
    const card = createPostCard(post);
    container.appendChild(card);
  });
}

function createPostCard(post) {
  const card = document.createElement("div");
  card.className = "post-card";

  const sentiment = (post.sentiment || "neutral").toLowerCase();
  const sentimentColor =
    sentiment === "positive"
      ? "positive"
      : sentiment === "negative"
      ? "negative"
      : "neutral";

  const timestamp = post.created_at
    ? new Date(post.created_at).toLocaleString()
    : new Date().toLocaleString();

  const tagsHtml =
    post.hashtags && post.hashtags.length > 0
      ? post.hashtags.map((tag) => `<span class="tag">#${tag}</span>`).join("")
      : "";

  card.innerHTML = `
    <div class="post-header">
      <div class="post-meta">
        <span class="post-id">User: ${post.user_id || "Unknown"}</span>
        <span class="post-timestamp">${timestamp}</span>
      </div>
      <span class="sentiment-badge ${sentimentColor}">
        ${sentiment}
      </span>
    </div>
    <div class="post-content">
      ${escapeHtml(post.content || "")}
    </div>
    ${tagsHtml ? `<div class="post-tags">${tagsHtml}</div>` : ""}
  `;

  return card;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function showEmptyState() {
  const container = document.getElementById("postsContainer");
  if (!container) return;

  container.innerHTML = `
    <div class="empty-state">
      <p>No posts yet</p>
      <p style="font-size: 14px;">Start uploading posts to see analytics here.</p>
    </div>
  `;
}
async function loadReach(period) {
  const response = await fetch(
    `${API_BASE_URL}/analytics/reach?period=${period}`
  );
  const data = await response.json();
  renderReachChart(data);
}

function renderReachChart(data) {
  const ctx = document.getElementById("reachChart");
  if (!ctx) return;

  const labels = data.map((d) => d._id);
  const reach = data.map((d) => d.total_reach);
  const views = data.map((d) => d.total_views);

  new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Reach",
          data: reach,
          borderWidth: 2,
          tension: 0.3,
        },
        {
          label: "Views",
          data: views,
          borderWidth: 2,
          tension: 0.3,
        },
      ],
    },
  });
}
