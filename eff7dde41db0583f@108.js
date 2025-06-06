function _chart($0)
{
  return $0;
}


function _gallery(html,d3,cleanData)
{
  const container = html`<div style="padding: 10px; font-family: 'Inter', sans-serif; position: relative;"></div>`;

  const maxFilms = d3.max(cleanData, d => d.count_of_id);
  const maxVotes = d3.max(cleanData, d => d.sum_vote_count);

  const select = html`<select style="margin-bottom: 10px; font-size: 14px; padding: 10px;">
    <option value="count_of_id" selected>🎬 Top 20 Prolific Directors</option>
    <option value="sum_vote_count">👍 Top 20 Most Voted Directors</option>
    <option value="">🔽 View: All Directors Grid</option>
  </select>`;
  container.appendChild(select);

 const chartBox = html`<div style="margin: 0 auto 10px auto; position: relative; width: 100%; max-width: 900px; padding: 0 20px;"></div>`;

  container.appendChild(chartBox);

  const grid = html`<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 16px; max-height: 720px; overflow-y: auto; padding-right: 6px;"></div>`;
  container.appendChild(grid);

  const sorted = [...cleanData].sort((a, b) => d3.descending(a.count_of_id, b.count_of_id));
  sorted.forEach(d => {
    const card = html`
      <div style="background: #000; border-radius: 8px; text-align: center; padding: 12px; transition: transform 0.2s;"
        onmouseover="${() => card.style.transform = 'scale(1.03)'}"
        onmouseout="${() => card.style.transform = 'scale(1)'}"
      >
        <img src="${d.director_image}" style="width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 50%; border: ${d.count_of_id === maxFilms ? '3px solid gold' : 'none'}; box-shadow: ${d.sum_vote_count === maxVotes ? '0 0 10px 4px rgba(0,123,255,0.4)' : 'none'}; margin-bottom: 8px;" />
        <strong style="display:block; font-size: 14px; color:white;">
          ${d.director}${d.count_of_id === maxFilms ? '👑' : ''}${d.sum_vote_count === maxVotes ? '🔥' : ''}
        </strong>
        <small style="font-size: 14px; color:white;">🎬 ${d.count_of_id} film(s)<br/>👍 ${d.sum_vote_count} votes</small>
      </div>`;
    grid.appendChild(card);
  });

  select.onchange = () => {
    chartBox.innerHTML = "";
    if (!select.value) {
      chartBox.style.display = "none";
      grid.style.display = "grid";
      return;
    }

    grid.style.display = "none";
    chartBox.style.display = "block";

    const top20 = [...cleanData].sort((a, b) => d3.descending(a[select.value], b[select.value])).slice(0, 20);

    const width = 700;
    const height = 520;
    const margin = { top: 5, right: 120, bottom: 40, left: 260 };

    const svg = d3.create("svg")
      .attr("width", width)
      .attr("height", height)
      .style("background", "transparent");

    const x = d3.scaleLinear()
      .domain([0, d3.max(top20, d => d[select.value])])
      .range([margin.left + 40, width - margin.right]);

    const y = d3.scaleBand()
      .domain(top20.map(d => d.director))
      .range([margin.top, height - margin.bottom])
      .padding(0.25);

    svg.on("click", () => {
      const shuffled = d3.shuffle(top20);
      y.domain(shuffled.map(d => d.director));

      svg.selectAll("rect")
        .data(shuffled, d => d.director)
        .transition().duration(800)
        .attr("y", d => y(d.director));

      svg.selectAll("text.bar-label")
        .data(shuffled, d => d.director)
        .transition().duration(800)
        .attr("y", d => y(d.director) + y.bandwidth() / 2);

      svg.selectAll("text.name-label")
        .data(shuffled, d => d.director)
        .transition().duration(800)
        .attr("y", d => y(d.director) + y.bandwidth() / 2 + 4);
    });

    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(5, "~s"))
      .selectAll("text")
      .style("font-family", "Inter");

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
          .call(enter => enter.transition().duration(800).attr("width", d => x(d[select.value]) - x(0))),
        update => update.transition().duration(800)
          .attr("y", d => y(d.director))
          .attr("width", d => x(d[select.value]) - x(0)),
        exit => exit.transition().duration(400).attr("width", 0).remove()
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
          .attr("font-size", "14px")
          .attr("dominant-baseline", "middle")
          .style("opacity", 0)
          .call(enter => enter.transition().duration(800).style("opacity", 1)),
        update => update.transition().duration(800)
          .attr("x", d => x(d[select.value]) + 5)
          .attr("y", d => y(d.director) + y.bandwidth() / 2)
      );

    const tooltip = html`<div style="
      position: absolute;
      pointer-events: none;
      background: white;
      border: 1px solid #ccc;
      padding: 6px 10px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      font-size: 12px;
      display: none;
      z-index: 10;
      font-family: 'Inter', sans-serif;
      max-width: 220px;
      min-width: 160px;
    "></div>`;
    chartBox.appendChild(tooltip);

    svg.append("g")
      .selectAll("text.name-label")
      .data(top20, d => d.director)
      .join(
        enter => enter.append("text")
          .attr("class", "name-label")
          .attr("x", margin.left - 4)
          .attr("y", d => y(d.director) + y.bandwidth() / 2 + 4)
          .text(d => d.director)
          .attr("text-anchor", "end")
          .style("font-size", "13px")
          .style("font-family", "Inter")
          .style("font-weight", "500")
          .style("dominant-baseline", "middle")
          .style("cursor", "pointer")
          .on("mouseover", (event, d) => {
            tooltip.innerHTML = `
              <div style="text-align:center;">
                <img src="${d.director_image}" style="width:52px;height:52px;border-radius:50%;object-fit:cover;margin-bottom:4px" />
                <div style="font-weight:600;">${d.director}</div>
                <div style="font-size:12px;">🎬 ${d.count_of_id} | 👍 ${d.sum_vote_count}</div>
              </div>
            `;
            tooltip.style.display = "block";
          })
         .on("mousemove", event => {
  const tooltipWidth = tooltip.offsetWidth;
  const tooltipHeight = tooltip.offsetHeight;
  const padding = 10;

  const bounds = chartBox.getBoundingClientRect(); // container chứa biểu đồ
  const mouseX = event.clientX - bounds.left;
  const mouseY = event.clientY - bounds.top;

  const left = (mouseX + tooltipWidth + padding > bounds.width)
    ? (mouseX - tooltipWidth - padding)
    : (mouseX + padding);

  const top = (mouseY + tooltipHeight + padding > bounds.height)
    ? (mouseY - tooltipHeight - padding)
    : (mouseY + padding);

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
})

          .on("mouseout", () => {
            tooltip.style.display = "none";
          }),
        update => update.transition().duration(800)
          .attr("y", d => y(d.director) + y.bandwidth() / 2 + 4)
      );

    const wrapper = html`<div style="display: flex; justify-content: center; margin-top: 40px;"></div>`;
wrapper.appendChild(svg.node());
chartBox.appendChild(wrapper);
  };

  select.onchange();
  return container;
}
