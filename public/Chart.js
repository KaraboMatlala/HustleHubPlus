
const ctx = document.getElementById("taxChart");

new Chart(ctx, {
    type: "doughnut",
    data: {
        labels: ["Estimated Tax", "Income After Tax"],
        datasets: [{
            data: [40572, 259428],
            backgroundColor: ["#ea0ea4", "#f7f6f6"]
        }]
    },
    options: {
        responsive: true,
        plugins: {
            legend: {
                position: "bottom"
            },
            tooltip: {
                callbacks: {
                    label: item =>
                        item.label + ": R" +
                        item.raw.toLocaleString("en-ZA")
                }
            }
        }
    }
});
