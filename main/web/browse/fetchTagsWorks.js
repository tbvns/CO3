import { extractPaginationInfo, parseWorkElements } from './fetchWorks';
import getUrl from '../requestManager';

let DomParser = require('react-native-html-parser').DOMParser;

function buildTagSearchParams(filters = {}, page = 1) {
  const params = new URLSearchParams();

  const isFlat = Object.keys(filters).some(k => k.startsWith('work_search['));

  if (isFlat) {
    if (filters['work_search[sort_column]']) {
      params.append('work_search[sort_column]', filters['work_search[sort_column]']);
    }
    if (filters['work_search[sort_direction]']) {
      params.append('work_search[sort_direction]', filters['work_search[sort_direction]']);
    }
    if (filters['work_search[query]']) {
      params.append('work_search[query]', filters['work_search[query]']);
    }
    if (filters['work_search[complete]']) {
      params.append('work_search[complete]', filters['work_search[complete]']);
    }
    if (filters['work_search[crossover]']) {
      params.append('work_search[crossover]', filters['work_search[crossover]']);
    }
    if (filters['work_search[language_id]']) {
      params.append('work_search[language_id]', filters['work_search[language_id]']);
    }
    if (filters['work_search[single_chapter]']) {
      params.append('work_search[single_chapter]', filters['work_search[single_chapter]']);
    }
    if (filters['work_search[word_count]']) {
      params.append('work_search[word_count]', filters['work_search[word_count]']);
    }
    if (filters['work_search[revised_at]']) {
      params.append('work_search[revised_at]', filters['work_search[revised_at]']);
    }
    if (filters['work_search[title]']) {
      params.append('work_search[title]', filters['work_search[title]']);
    }
    if (filters['work_search[creators]']) {
      params.append('work_search[creators]', filters['work_search[creators]']);
    }
    if (filters['work_search[hits]']) {
      params.append('work_search[hits]', filters['work_search[hits]']);
    }
    if (filters['work_search[kudos_count]']) {
      params.append('work_search[kudos_count]', filters['work_search[kudos_count]']);
    }
    if (filters['work_search[comments_count]']) {
      params.append('work_search[comments_count]', filters['work_search[comments_count]']);
    }
    if (filters['work_search[bookmarks_count]']) {
      params.append('work_search[bookmarks_count]', filters['work_search[bookmarks_count]']);
    }

    if (filters['work_search[fandom_names]']) {
      params.append('work_search[fandom_names]', filters['work_search[fandom_names]']);
    }
    if (filters['work_search[character_names]']) {
      params.append('work_search[character_names]', filters['work_search[character_names]']);
    }
    if (filters['work_search[relationship_names]']) {
      params.append('work_search[relationship_names]', filters['work_search[relationship_names]']);
    }
    if (filters['work_search[freeform_names]']) {
      params.append('work_search[freeform_names]', filters['work_search[freeform_names]']);
    }

    if (filters['work_search[rating_ids]']) {
      params.append('work_search[rating_ids][]', filters['work_search[rating_ids]']);
    }
    (filters['work_search[archive_warning_ids][]'] || []).forEach(id =>
      params.append('work_search[archive_warning_ids][]', id)
    );
    (filters['work_search[category_ids][]'] || []).forEach(id =>
      params.append('work_search[category_ids][]', id)
    );

    if (filters['work_search[excluded_tag_names]']) {
      params.append('work_search[excluded_tag_names]', filters['work_search[excluded_tag_names]']);
    }

  } else {
    if (filters.sortColumn) {
      params.append('work_search[sort_column]', filters.sortColumn);
    }

    const { include = {}, exclude = {} } = filters;

    (include.ratingIds || []).forEach(id =>
      params.append('include_work_search[rating_ids][]', id)
    );
    (include.warningIds || []).forEach(id =>
      params.append('include_work_search[archive_warning_ids][]', id)
    );
    (include.categoryIds || []).forEach(id =>
      params.append('include_work_search[category_ids][]', id)
    );
    (include.fandomIds || []).forEach(id =>
      params.append('include_work_search[fandom_ids][]', id)
    );
    (include.characterIds || []).forEach(id =>
      params.append('include_work_search[character_ids][]', id)
    );
    (include.relationshipIds || []).forEach(id =>
      params.append('include_work_search[relationship_ids][]', id)
    );
    (include.freeformIds || []).forEach(id =>
      params.append('include_work_search[freeform_ids][]', id)
    );
    if (include.otherTagNames) {
      params.append('work_search[other_tag_names]', include.otherTagNames);
    }

    (exclude.ratingIds || []).forEach(id =>
      params.append('exclude_work_search[rating_ids][]', id)
    );
    (exclude.warningIds || []).forEach(id =>
      params.append('exclude_work_search[archive_warning_ids][]', id)
    );
    (exclude.categoryIds || []).forEach(id =>
      params.append('exclude_work_search[category_ids][]', id)
    );
    (exclude.fandomIds || []).forEach(id =>
      params.append('exclude_work_search[fandom_ids][]', id)
    );
    (exclude.characterIds || []).forEach(id =>
      params.append('exclude_work_search[character_ids][]', id)
    );
    (exclude.relationshipIds || []).forEach(id =>
      params.append('exclude_work_search[relationship_ids][]', id)
    );
    (exclude.freeformIds || []).forEach(id =>
      params.append('exclude_work_search[freeform_ids][]', id)
    );
    if (exclude.excludedTagNames) {
      params.append('work_search[excluded_tag_names]', exclude.excludedTagNames);
    }

    if (filters.crossover !== undefined && filters.crossover !== null) {
      params.append('work_search[crossover]', filters.crossover);
    }
    if (filters.complete !== undefined && filters.complete !== null) {
      params.append('work_search[complete]', filters.complete);
    }
    if (filters.wordsFrom !== undefined && filters.wordsFrom !== null) {
      params.append('work_search[words_from]', filters.wordsFrom);
    }
    if (filters.wordsTo !== undefined && filters.wordsTo !== null) {
      params.append('work_search[words_to]', filters.wordsTo);
    }
    if (filters.dateFrom) {
      params.append('work_search[date_from]', filters.dateFrom);
    }
    if (filters.dateTo) {
      params.append('work_search[date_to]', filters.dateTo);
    }
    if (filters.query) {
      params.append('work_search[query]', filters.query);
    }
    if (filters.languageId) {
      params.append('work_search[language_id]', filters.languageId);
    }
  }

  if (page > 1) {
    params.append('page', page.toString());
  }

  params.append('commit', 'Sort and Filter');

  return params;
}

export async function fetchTagWorks(tagName, filters = {}, page = 1) {
  if (!tagName) {
    throw new Error('fetchTagWorks: tagName is required');
  }

  try {
    const encodedTag = encodeURIComponent(tagName.replace(/\//g, '*s*').replace(/\./g, '*d*'));
    const params = buildTagSearchParams(filters, page);
    const url = `https://archiveofourown.org/tags/${encodedTag}/works?${params.toString()}`;

    console.log(`Fetching tag works from: ${url}`);
    const response = await getUrl(url);
    console.log(response);

    const doc = new DomParser().parseFromString(response, 'text/html');

    const workElements = Array.from(doc.getElementsByTagName('li'))
      .filter(li => li.getAttribute('class')?.includes('work blurb'));

    const works = parseWorkElements(workElements);
    const paginationInfo = extractPaginationInfo(doc);

    console.log(
      `Found ${works.length} works on page ${paginationInfo.currentPage} of ${paginationInfo.maxPages}`
    );

    return {
      works,
      currentPage: paginationInfo.currentPage,
      maxPages: paginationInfo.maxPages,
      hasMore: paginationInfo.currentPage < paginationInfo.maxPages,
    };
  } catch (error) {
    console.error('Error fetching tag works:', error);
    throw error;
  }
}