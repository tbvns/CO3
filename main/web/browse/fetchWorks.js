import ky from "ky";
import {Work} from "../../database/models/work";
let DomParser = require("react-native-html-parser").DOMParser;

function getElementText(element) {
    if (!element) return null;
    let text = "";
    if (element.nodeType === 3) return element.nodeValue?.trim() || null;

    for (let i = 0; i < element.childNodes.length; i++) {
        const child = element.childNodes[i];
        text += child.nodeType === 3 ? child.nodeValue : getElementText(child) || "";
    }
    return text.trim() || null;
}

function parseDate(dateString) {
    if (!dateString) return null;
    try {
        return new Date(dateString).getTime();
    } catch {
        return null;
    }
}

function parseChapters(chapterText) {
    if (!chapterText) return { current: 1, total: null };

    const match = chapterText.match(/(\d+)\/(\d+|\?)/);
    if (match) {
        return {
            current: parseInt(match[1], 10),
            total: match[2] === '?' ? null : parseInt(match[2], 10)
        };
    }
    return { current: 1, total: null };
}

function extractRequiredTags(workElement) {
    const requiredTags = workElement.getElementsByClassName("required-tags")[0];
    if (!requiredTags) return {};

    const tags = Array.from(requiredTags.getElementsByTagName("li"));
    const result = {};

    tags.forEach(tag => {
        const span = tag.getElementsByTagName("span")[0];
        if (!span) return;

        const className = span.getAttribute("class") || "";
        const title = span.getAttribute("title") || "";

        if (className.includes("rating")) {
            result.rating = title;
        } else if (className.includes("warnings")) {
            result.warnings = title;
            result.warningStatus = className.includes("warning-yes") ? "Yes" : "No";
        } else if (className.includes("category")) {
            result.category = title;
        } else if (className.includes("complete")) {
            result.isCompleted = className.includes("complete-yes");
        }
    });

    return result;
}

function categorizeTagsByClass(workElement) {
    const tagsContainer = workElement.getElementsByClassName("tags commas")[0];
    if (!tagsContainer) return { warnings: [], relationships: [], characters: [], freeforms: [] };

    const tagItems = Array.from(tagsContainer.getElementsByTagName("li"));
    const categorized = {
        warnings: [],
        relationships: [],
        characters: [],
        freeforms: []
    };

    tagItems.forEach(item => {
        const className = item.getAttribute("class") || "";
        const linkElement = item.getElementsByTagName("a")[0];
        const tagText = getElementText(linkElement);

        if (tagText) {
            if (className.includes("warnings")) {
                categorized.warnings.push(tagText);
            } else if (className.includes("relationships")) {
                categorized.relationships.push(tagText);
            } else if (className.includes("characters")) {
                categorized.characters.push(tagText);
            } else if (className.includes("freeforms")) {
                categorized.freeforms.push(tagText);
            }
        }
    });

    return categorized;
}

export async function getRecentWorks() {
    try {
        const response = await ky.get("https://archiveofourown.org/works").text();
        const doc = new DomParser().parseFromString(response, "text/html");

        const workElements = Array.from(doc.getElementsByTagName("li"))
            .filter(li => li.getAttribute("class")?.includes("work blurb"));

        console.log(`Found ${workElements.length} work elements`);

        return workElements.map(workElement => {
            const workId = workElement.getAttribute("id")?.replace("work_", "") || null;

            const heading = workElement.getElementsByTagName("h4")[0];
            const titleElement = heading?.getElementsByTagName("a")[0];
            const authorElement = Array.from(heading?.getElementsByTagName("a") || [])
                .find(a => a.getAttribute("rel") === "author");

            const fandomElements = Array.from(
                workElement.getElementsByClassName("fandoms")[0]?.getElementsByTagName("a") || []
            );

            const requiredTags = extractRequiredTags(workElement);

            const categorizedTags = categorizeTagsByClass(workElement);

            const allTags = [
                ...categorizedTags.relationships,
                ...categorizedTags.characters,
                ...categorizedTags.freeforms
            ];

            const summaryElement = workElement.getElementsByClassName("userstuff summary")[0]?.getElementsByTagName("p")[0];

            const dateElement = workElement.getElementsByClassName("datetime")[0];
            const dateText = getElementText(dateElement);

            const stats = {};
            const statElements = workElement.getElementsByClassName("stats")[0];

            if (statElements) {
                const ddElements = Array.from(statElements.getElementsByTagName("dd"));
                ddElements.forEach(dd => {
                    const className = dd.getAttribute("class") || "";
                    const value = getElementText(dd);
                    if (value) {
                        stats[className] = value;
                    }
                });
            }

            const chapterInfo = parseChapters(stats.chapters);

            const parseNumber = (str) => {
                if (!str) return 0;
                const num = parseInt(str.replace(/,/g, ''), 10);
                return isNaN(num) ? 0 : num;
            };

            return new Work({
                id: workId,
                title: getElementText(titleElement),
                author: getElementText(authorElement),
                kudos: parseNumber(stats.kudos),
                hits: parseNumber(stats.hits),
                language: stats.language || 'English',
                updated: parseDate(dateText),
                bookmarks: parseNumber(stats.bookmarks),
                tags: allTags,
                warnings: categorizedTags.warnings,
                description: getElementText(summaryElement),
                chapters: [],
                currentChapter: chapterInfo.current,
                chapterCount: chapterInfo.total,
                rating: requiredTags.rating || 'Not Rated',
                category: requiredTags.category || 'None',
                warningStatus: requiredTags.warningStatus || 'NoWarningsApply',
                isCompleted: requiredTags.isCompleted
            });
        });
    } catch (error) {
        console.error("Error:", error);
        return [];
    }
}