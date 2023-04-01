const app = Vue.createApp({
    data() {
      return {
        headers: [],
        rows: [],
        searchText: "",

        // Add this data property for datasets
        datasets: [
          {
            name: "None",
            headers: [],
            rows: [],
          },
        ],
        selectedDatasetIndex: 0, // default selected dataset
      };
    },
    computed: {
      filteredRows() {
        if (!this.searchText) {
          return this.rows;
        }
        const searchWords = this.searchText.toLowerCase().split(/\s+/);
        return this.rows.filter((row) => {
          return searchWords.every((word) =>
            row.some((cell) => cell.toLowerCase().includes(word))
          );
        });
      },
      selectedDataset() {
        return this.datasets[this.selectedDatasetIndex];
      },
    },
    methods: {
      async loadCSV(event) {
        const file = event.target.files[0];
        if (!file) {
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target.result;
          this.processCSV(content, file.name);
        };
        reader.readAsBinaryString(file);
      },
      processCSV(content, datasetName) {
        const encodingType = Encoding.detect(content);
        const content_utf = Encoding.convert(content, {
          from: encodingType,
          to: "UNICODE",
          type: "string",
        });

        const rows = this.parseCSVRows(content_utf);

        this.headers = rows.shift();
        this.rows = rows;

        // Save the dataset to LocalStorage
        if (!datasetName) {
          const inputDatasetName = prompt(
            "Enter a name for the dataset",
            "Dataset"
          );
          datasetName = inputDatasetName;
        }
        if (datasetName) {
          this.datasets.push({
            name: datasetName,
            headers: this.headers,
            rows: this.rows,
          });
          localStorage.setItem("datasets", JSON.stringify(this.datasets));
        }
      },
      parseCSVRows(text) {
        const lines = text.trim().split(/\r?\n/);
        const rows = [];

        let currentRow = [];
        let currentValue = "";
        let inQuotes = false;

        for (const line of lines) {
          for (let i = 0; i < line.length; i++) {
            const currentChar = line[i];

            if (inQuotes) {
              if (currentChar === '"') {
                if (line[i + 1] === '"') {
                  currentValue += '"';
                  i++;
                } else {
                  inQuotes = false;
                }
              } else {
                currentValue += currentChar;
              }
            } else {
              if (currentChar === '"') {
                inQuotes = true;
              } else if (currentChar === ",") {
                currentRow.push(currentValue);
                currentValue = "";
              } else {
                currentValue += currentChar;
              }
            }
          }

          if (inQuotes) {
            currentValue += "\n";
          } else {
            currentRow.push(currentValue);
            rows.push(currentRow);
            currentRow = [];
            currentValue = "";
          }
        }

        return rows;
      },
      clearLocalStorage() {
        localStorage.removeItem("datasets");
        this.datasets = [
          {
            name: "Default",
            headers: [],
            rows: [],
          },
        ];
        this.selectedDatasetIndex = 0;
      },
      async loadInitialData() {
        // Load data from LocalStorage
        const datasets = localStorage.getItem("datasets");

        if (datasets) {
          this.datasets = JSON.parse(datasets);
          return;
        }

        // Fetch initial data if not in LocalStorage
        try {
          const response = await fetch("initialdb.csv");
          if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
          }

          const content = await response.text();
          this.processCSV(content, "Sample Data");
        } catch (error) {
          console.error("Failed to load initial data:", error);
        }
      },
      selectDataset(index) {
        this.selectedDatasetIndex = index;
        this.headers = this.selectedDataset.headers;
        this.rows = this.selectedDataset.rows;
      },
      handleDragEnter(event) {
        console.log("Drag Enter");
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
      },
      handleDragOver(event) {
        console.log("Drag Over");
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
      },
      handleDragLeave(event) {
        console.log("Drag Leave");
        event.preventDefault();
      },
      handleDrop(event) {
        console.log("Dropped File");
        event.preventDefault();
        const file = event.dataTransfer.files[0];
        if (!file) {
          return;
        }
        this.loadCSV({ target: { files: [file] } });
      },
    },
    created() {
      this.loadInitialData();
    },
  });
  app.mount("#app");