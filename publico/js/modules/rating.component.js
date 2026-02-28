export class RatingComponent {

    constructor(container, outputElement) {
        this.container = container;
        this.output = outputElement;
        this.value = 0;
        this.init();
    }

    init() {
        this.container.querySelectorAll(".star").forEach(star => {
            star.addEventListener("click", () => {
                this.value = Number(star.dataset.value);
                this.updateUI();
            });
        });
    }

    updateUI() {
        this.container.querySelectorAll(".star").forEach(star => {
            const val = Number(star.dataset.value);
            star.classList.toggle("active", val <= this.value);
        });

        this.output.textContent = `${this.value} / 5`;
    }

    getValue() {
        return this.value;
    }

}