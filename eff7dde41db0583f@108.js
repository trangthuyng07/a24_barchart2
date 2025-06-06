function _chart($0)
{
  return $0;
}


function _gallery(html,d3,cleanData)
{
  const container = html`<div style="padding: 20px; font-family: 'Inter', sans-serif; position: relative;"></div>`;

  const maxFilms = d3.max(cleanData, d => d.count_of_id);
  const maxVotes = d3.max(cleanData, d => d.sum_vote_count);

  // 1. DROPDOWN SELECT
  const select = html`<select style="margin-bottom: 20px; font-size: 14px; padding: 6px;">
    <option value="count_of_id" selected>🎬 Top 20 Prolific Directors</option>
    <option value="sum_vote_count">👍 Top 20 Most Voted Directors</option>
    <option value="">🔽 View: All Directors Grid</option>
  </select>`;
  container.appendChild(select);

  // 2. BAR CHART CONTAINER
  const chartBox = html`<div style="margin-bottom: 40px; position: relative;"></div>`;
  container.appendChild(chartBox);

  // 3. GALLERY GRID
const grid = html`
  <div style="
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 16px;
    max-height: 720px;
    overflow-y: auto;
    padding-right: 6px;
    scrollbar-width: thin;
    scrollbar-color: #555 #111;
  "></div>
`;

  container.appendChild(grid);

  const sorted = [...cleanData].sort((a, b) => d3.descending(a.count_of_id, b.count_of_id));
  sorted.forEach(d => {
    const card = html`
      <div style="
        background: #000;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        overflow: hidden;
        text-align: center;
        padding: 12px;
        transition: transform 0.2s;
      "
        onmouseover="${() => card.style.transform = 'scale(1.03)'}"
        onmouseout="${() => card.style.transform = 'scale(1)'}"
      >
        <img src="${d.director_image}" style="
          width: 100%;
          aspect-ratio: 1;
          object-fit: cover;
          border-radius: 50%;
          border: ${d.count_of_id === maxFilms ? '3px solid gold' : 'none'};
          box-shadow: ${d.sum_vote_count === maxVotes ? '0 0 10px 4px rgba(0,123,255,0.4)' : 'none'};
          margin-bottom: 8px;
        "/>
        <strong style="display:block; font-size: 14px;color:white;">
          ${d.director}
          ${d.count_of_id === maxFilms ? '👑' : ''}
          ${d.sum_vote_count === maxVotes ? '🔥' : ''}
        </strong>
        <small style="font-size: 14px; color:white;">
          🎬 ${d.count_of_id} film(s)<br/>
          👍 ${d.sum_vote_count} votes
        </small>
      </div>
    `;
    grid.appendChild(card);
  });

  // 4. ON SELECT CHANGE
  select.onchange = () => {
    chartBox.innerHTML = "";

    if (!select.value) {
      chartBox.style.display = "none";
      grid.style.display = "grid";
      return;
    }

    grid.style.display = "none";
    chartBox.style.display = "block";

    const top20 = [...cleanData]
      .sort((a, b) => d3.descending(a[select.value], b[select.value]))
      .slice(0, 20);

    const width = 960;
    const height = 800;
    const margin = { top: 20, right: 30, bottom: 40, left: 260 };

    const svg = d3.create("svg")
      .attr("width", width)
      .attr("height", height)
      .style("background", "transparent"); // 👈 transparent background

    const x = d3.scaleLinear()
      .domain([0, d3.max(top20, d => d[select.value])])
      .range([margin.left + 50, width - margin.right]);

    const y = d3.scaleBand()
      .domain(top20.map(d => d.director))
      .range([margin.top, height - margin.bottom])
      .padding(0.35);

    // Thêm nút hoặc bắt sự kiện click để shuffle
svg.on("click", () => {
  const shuffled = d3.shuffle(top20); // 🌀 Xáo trộn thứ tự top 20
  y.domain(shuffled.map(d => d.director)); // cập nhật domain mới theo thứ tự mới

  // Animate bar
  svg.selectAll("rect")
    .data(shuffled, d => d.director)
    .transition()
    .duration(800)
    .attr("y", d => y(d.director));

  // Animate label số
  svg.selectAll("text.bar-label")
    .data(shuffled, d => d.director)
    .transition()
    .duration(800)
    .attr("y", d => y(d.director) + y.bandwidth() / 2);

  // Animate tên đạo diễn
  svg.selectAll("text")
    .filter(function() {
      return this.textContent && top20.some(d => d.director === this.textContent);
    })
    .transition()
    .duration(800)
    .attr("y", d => y(d.director) + 5);
});

    // X axis
    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(5, "~s"))
      .selectAll("text")
      .style("font-family", "Inter");

    // Bar chart (black bars)
svg.append("g")
  .selectAll("rect")
  .data(top20, d => d.director)
  .join(
    enter => enter.append("rect")
      .attr("x", x(0))
      .attr("y", d => y(d.director))
      .attr("width", 0)
      .attr("height", y.bandwidth())
      .attr("fill", "#000")
      .call(enter => enter.transition().duration(800)
        .attr("width", d => x(d[select.value]) - x(0))
      ),
    update => update
      .call(update => update.transition().duration(800)
        .attr("y", d => y(d.director))
        .attr("width", d => x(d[select.value]) - x(0))
      ),
    exit => exit
      .call(exit => exit.transition().duration(400)
        .attr("width", 0)
        .remove())
  );

svg.append("g")
  .selectAll("text.bar-label")
  .data(top20, d => d.director)
  .join(
    enter => enter.append("text")
      .attr("class", "bar-label")
      .attr("x", d => x(d[select.value]) + 5)
      .attr("y", d => y(d.director) + y.bandwidth() / 2)
      .text(d => d3.format(",")(d[select.value]))
      .attr("fill", "#000")
      .attr("font-size", "12px")
      .attr("dominant-baseline", "middle")
      .style("opacity", 0)
      .call(enter => enter.transition().duration(800).style("opacity", 1)),
    update => update
      .call(update => update.transition().duration(800)
        .attr("x", d => x(d[select.value]) + 5)
        .attr("y", d => y(d.director) + y.bandwidth() / 2)
        .text(d => d3.format(",")(d[select.value]))
      ),
    exit => exit.transition().duration(400).style("opacity", 0).remove()
  );


    // === Tooltip container
    const tooltip = html`<div style="
      position: absolute;
      pointer-events: none;
      background: white;
      border: 1px solid #ccc;
      padding: 6px;
      border-radius: 8px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.15);
      font-size: 12px;
      display: none;
      z-index: 50;
      font-family: 'Inter', sans-serif;
    "></div>`;
    chartBox.appendChild(tooltip);

    // === Director labels with tooltip on hover
 const nameLabels = svg.append("g")
  .selectAll("text.name-label")
  .data(top20, d => d.director)
  .join(
    enter => enter.append("text")
      .attr("class", "name-label")
      .attr("x", margin.left - 10)
      .attr("y", d => y(d.director) + y.bandwidth() / 2 + 5)
      .text(d => d.director)
      .attr("text-anchor", "end")
      .style("font-size", "14px")
      .style("font-family", "Inter")
      .style("font-weight", "500")
      .style("dominant-baseline", "middle")
      .style("cursor", "pointer")
      .on("mouseover", (event, d) => {
        tooltip.innerHTML = `
          <img src="${d.director_image}" style="width:60px;height:60px;border-radius:50%;object-fit:cover;margin-bottom:4px" />
          <div><strong>${d.director}</strong></div>
          <div>🎬 ${d.count_of_id} films</div>
          <div>👍 ${d.sum_vote_count} votes</div>
        `;
        tooltip.style.display = "block";
      })
      .on("mousemove", event => {
        tooltip.style.left = (event.pageX + 12) + "px";
        tooltip.style.top = (event.pageY - 20) + "px";
      })
      .on("mouseout", () => {
        tooltip.style.display = "none";
      }),
    update => update
      .call(update => update.transition().duration(800)
        .attr("y", d => y(d.director) + y.bandwidth() / 2 + 5)
      )
  );


    chartBox.appendChild(svg.node());
  };

  // 5. INITIAL TRIGGER
  select.onchange();

  return container;
}


function _3(d3,cleanData){return(
d3.extent(cleanData, d => d.sum_vote_count)
)}

function _cleanData(data){return(
data.filter(d =>
  typeof d.sum_vote_count === "number" &&
  d.sum_vote_count > 0 &&
  d.director_image &&
  d.director_image.startsWith("http")
)
)}

function _5(data){return(
data.map(d => ({
  name: d.director,
  vote: d.sum_vote_count,
  image: d.director_image
}))
)}

function _data(FileAttachment){return(
FileAttachment("A24_Directors_With_Image.csv").csv({typed: true})
)}

function _a24_directors_with_image(__query,FileAttachment,invalidation){return(
__query(FileAttachment("A24_Directors_With_Image.csv"),{from:{table:"A24_Directors_With_Image"},sort:[],slice:{to:null,from:null},filter:[],select:{columns:null}},invalidation)
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["A24_Directors_With_Image.csv", {url: new URL("./files/664087b7e0e0a81eae5637dad0aa3bd5414a326cba5b94eb3c10c8f75059bafb4744b83d02c21069ee934fd50597f62d59c759000d50bfc7da0e6c690709c954.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer("chart")).define("chart", ["viewof gallery"], _chart);
  main.variable(observer("viewof gallery")).define("viewof gallery", ["html","d3","cleanData"], _gallery);
  main.variable(observer("gallery")).define("gallery", ["Generators", "viewof gallery"], (G, _) => G.input(_));
  main.variable(observer()).define(["d3","cleanData"], _3);
  main.variable(observer("cleanData")).define("cleanData", ["data"], _cleanData);
  main.variable(observer()).define(["data"], _5);
  main.variable(observer("data")).define("data", ["FileAttachment"], _data);
  main.variable(observer("a24_directors_with_image")).define("a24_directors_with_image", ["__query","FileAttachment","invalidation"], _a24_directors_with_image);
  return main;
}
