document.addEventListener("DOMContentLoaded", () => {
  const modalBackground = document.querySelector(".modal-background-task-overlay");
  if (!modalBackground) return;
  attachModalBackgroundClick(modalBackground);
});

function attachModalBackgroundClick(modalBackground) {
  modalBackground.addEventListener("click", (event) => {
    if (event.target === modalBackground) {
      modalBackground.style.display = "none";
    }
  });
}

  