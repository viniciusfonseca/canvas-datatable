import "./styles.css";

const canvas = document.getElementsByTagName("canvas")[0];

const ctx = canvas.getContext("2d");

const state = {
  mouseoverdragX: false,
  mouseoverdragY: false,
  dragging: false,
  resizingX: false,
  resizingY: false,
  width: 40,
  height: 40
};

ctx.strokeStyle = "#000";
ctx.fillStyle = "#FFF";
ctx.strokeRect(0, 0, state.width, state.height);

function getMousePos(evt) {
  var rect = canvas.getBoundingClientRect();
  return {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top
  };
}

canvas.addEventListener("mousemove", e => {
  const { x, y } = getMousePos(e);
  state.mouseoverdragX =
    state.resizingX ||
    (!state.resizingY &&
      (y <= state.height + 2 && x >= state.width - 2 && x <= state.width + 2));
  state.mouseoverdragY =
    state.resizingY ||
    (!state.resizingX &&
      (x <= state.width + 2 && y >= state.height - 2 && y <= state.height + 2));
  if (state.mouseoverdragX && state.mouseoverdragY) {
    document.body.style.cursor = "se-resize";
  } else if (state.mouseoverdragY) {
    document.body.style.cursor = "row-resize";
  } else if (state.mouseoverdragX) {
    document.body.style.cursor = "col-resize";
  } else {
    document.body.style.cursor = "auto";
  }
  if (state.dragging) {
    if (state.mouseoverdragX) {
      state.resizingX = true;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeRect(0, 0, x, state.height);
      state.width = x;
    }
    if (state.mouseoverdragY) {
      state.resizingY = true;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeRect(0, 0, state.width, y);
      state.height = y;
    }
  }
});

canvas.addEventListener("mousedown", () => {
  state.dragging = true;
});

canvas.addEventListener("mouseup", () => {
  state.dragging = state.resizingX = state.resizingY = false;
});

canvas.addEventListener("mouseleave", () => {
  state.dragging = state.resizingX = state.resizingY = false;
});
