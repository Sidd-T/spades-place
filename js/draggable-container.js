export class DraggableContainer {
  static maxZIndex = 1000;

  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.header = this.container.querySelector(".container-header");
    this.closeBtn = this.container.querySelector(".close-btn");
    this.isDragging = false;
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;
    this.options = options;

    this.applySizeOptions();
    this.init();

    if (this.options.showByDefault) {
      this.show();
    }
  }

  applySizeOptions() {
    const dataset = this.container.dataset;
    const width = this.options.width ?? dataset.width;
    const height = this.options.height ?? dataset.height;
    const left = this.options.left ?? dataset.left;
    const top = this.options.top ?? dataset.top;
    const minWidth = this.options.minWidth ?? dataset.minWidth;
    const minHeight = this.options.minHeight ?? dataset.minHeight;

    const normalize = (value) => {
      if (value === undefined || value === null || value === "") return null;
      return typeof value === "number" ? `${value}px` : value;
    };

    if (normalize(width)) this.container.style.width = normalize(width);
    if (normalize(height)) this.container.style.height = normalize(height);
    if (normalize(left)) this.container.style.left = normalize(left);
    if (normalize(top)) this.container.style.top = normalize(top);
    if (normalize(minWidth))
      this.container.style.minWidth = normalize(minWidth);
    if (normalize(minHeight))
      this.container.style.minHeight = normalize(minHeight);
  }

  init() {
    this.header.addEventListener("mousedown", (e) => this.startDrag(e));
    document.addEventListener("mousemove", (e) => this.drag(e));
    document.addEventListener("mouseup", () => this.stopDrag());

    this.header.addEventListener("touchstart", (e) => this.startDrag(e));
    document.addEventListener("touchmove", (e) => this.drag(e));
    document.addEventListener("touchend", () => this.stopDrag());

    this.closeBtn.addEventListener("click", () => this.close());
  }

  startDrag(e) {
    this.isDragging = true;
    const rect = this.container.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    this.dragOffsetX = clientX - rect.left;
    this.dragOffsetY = clientY - rect.top;
    DraggableContainer.maxZIndex++;
    this.container.style.zIndex = DraggableContainer.maxZIndex;
  }

  drag(e) {
    if (!this.isDragging) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    let newX = clientX - this.dragOffsetX;
    let newY = clientY - this.dragOffsetY;

    newX = Math.max(
      0,
      Math.min(newX, window.innerWidth - this.container.offsetWidth),
    );
    newY = Math.max(
      0,
      Math.min(newY, window.innerHeight - 48 - this.container.offsetHeight),
    );

    this.container.style.left = `${newX}px`;
    this.container.style.top = `${newY}px`;
  }

  stopDrag() {
    this.isDragging = false;
  }

  close() {
    this.container.classList.remove("active");
  }

  show() {
    this.container.classList.add("active");
  }
}
