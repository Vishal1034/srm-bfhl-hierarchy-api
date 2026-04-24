const input = document.getElementById("inputData");
const submitBtn = document.getElementById("submitBtn");
const sampleBtn = document.getElementById("sampleBtn");
const resultEl = document.getElementById("result");
const statusEl = document.getElementById("status");
const entryCountEl = document.getElementById("entryCount");
const responseStateEl = document.getElementById("responseState");

const sample = [
  "A->B", "A->C", "B->D", "C->E", "E->F",
  "X->Y", "Y->Z", "Z->X",
  "P->Q", "Q->R",
  "G->H", "G->H", "G->I",
  "hello", "1->2", "A->"
].join(", ");

sampleBtn.addEventListener("click", () => {
  input.value = sample;
  updateEntryCount();
});

function tokenize(raw) {
  return raw
    .split(/[\n,\s]+/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function updateEntryCount() {
  const count = tokenize(input.value).length;
  entryCountEl.textContent = `${count} ${count === 1 ? "entry" : "entries"}`;
}

input.addEventListener("input", updateEntryCount);
updateEntryCount();

submitBtn.addEventListener("click", async () => {
  try {
    submitBtn.disabled = true;
    sampleBtn.disabled = true;
    statusEl.textContent = "Submitting...";
    statusEl.classList.remove("error");
    responseStateEl.textContent = "Loading";
    responseStateEl.classList.remove("muted");

    const usedUnicodeArrow = input.value.includes("→");
    const normalizedInput = input.value.replaceAll("→", "->");
    input.value = normalizedInput;
    updateEntryCount();

    const tokens = tokenize(normalizedInput);

    const response = await fetch("/bfhl", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ data: tokens })
    });

    if (!response.ok) {
      throw new Error(`API call failed with status ${response.status}`);
    }

    const payload = await response.json();
    resultEl.textContent = JSON.stringify(payload, null, 2);
    statusEl.textContent = usedUnicodeArrow
      ? "Success (converted Unicode arrow to -> automatically)"
      : "Success";
    responseStateEl.textContent = "Updated";
  } catch (error) {
    statusEl.textContent = error.message;
    statusEl.classList.add("error");
    resultEl.textContent = "No response due to error.";
    responseStateEl.textContent = "Error";
  } finally {
    submitBtn.disabled = false;
    sampleBtn.disabled = false;
  }
});
