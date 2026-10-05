import Company from '../models/Company.js';
import StudyMaterial from '../models/StudyMaterial.js';
import CodingProblem from '../models/CodingProblem.js';
import MockTest from '../models/MockTest.js';
import AptitudeQuestion from '../models/AptitudeQuestion.js';

/**
 * Escape regex special characters safely to prevent ReDoS / syntax errors.
 */
function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

/**
 * GET /api/search?q=<query>&limit=5
 * Unified global search across real database content.
 * Strictly adheres to student security & active content rules:
 * - Only active/published content returned
 * - Never returns hidden coding test cases, solutions, admin records, or private user data
 */
export const globalSearch = async (req, res, next) => {
  try {
    const rawQuery = (req.query.q || '').trim();

    if (!rawQuery) {
      return res.status(200).json({
        success: true,
        data: {
          query: '',
          totalResults: 0,
          companies: [],
          resources: [],
          coding: [],
          mockTests: [],
          aptitude: [],
        },
      });
    }

    if (rawQuery.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Search query is too long (maximum 100 characters)',
      });
    }

    const limit = Math.min(15, Math.max(1, parseInt(req.query.limit, 10) || 5));
    const safeRegex = new RegExp(escapeRegex(rawQuery), 'i');

    // Run parallel targeted queries across active collections
    const [companies, resources, codingProblems, mockTests, aptitudeTopics] = await Promise.all([
      // 1. Companies (active only)
      Company.find({
        isActive: true,
        $or: [{ name: safeRegex }, { industry: safeRegex }, { description: safeRegex }],
      })
        .select('name slug industry description logoUrl')
        .limit(limit)
        .lean(),

      // 2. Study Materials (active only)
      StudyMaterial.find({
        isActive: true,
        $or: [{ title: safeRegex }, { topic: safeRegex }, { category: safeRegex }],
      })
        .select('title category topic type description')
        .limit(limit)
        .lean(),

      // 3. Coding Problems (active only — strictly public fields, ZERO hidden test cases)
      CodingProblem.find({
        isActive: true,
        $or: [{ title: safeRegex }, { category: safeRegex }, { difficulty: safeRegex }],
      })
        .select('title slug difficulty category')
        .limit(limit)
        .lean(),

      // 4. Mock Tests (published only)
      MockTest.find({
        isPublished: true,
        $or: [{ title: safeRegex }, { categories: safeRegex }, { difficulty: safeRegex }],
      })
        .select('title slug durationMinutes totalQuestions categories difficulty')
        .limit(limit)
        .lean(),

      // 5. Aptitude Topics / Subcategories (active only)
      AptitudeQuestion.find({
        isActive: true,
        $or: [{ category: safeRegex }, { topic: safeRegex }, { subcategory: safeRegex }],
      })
        .select('category topic subcategory difficulty')
        .limit(limit)
        .lean(),
    ]);

    // Format results with validated navigation links
    const formattedCompanies = companies.map((c) => ({
      id: c._id,
      title: c.name,
      subtitle: c.industry || 'Technology',
      description: c.description ? c.description.slice(0, 100) + '...' : '',
      type: 'company',
      link: `/companies/${c.slug || c._id}`,
    }));

    const formattedResources = resources.map((r) => ({
      id: r._id,
      title: r.title,
      subtitle: `${r.category || 'General'} • ${r.type ? r.type.toUpperCase() : 'RESOURCE'}`,
      description: r.description ? r.description.slice(0, 100) + '...' : '',
      type: 'resource',
      link: `/resources/${r._id}`,
    }));

    const formattedCoding = codingProblems.map((cp) => ({
      id: cp._id,
      title: cp.title,
      subtitle: `${cp.category || 'Algorithms'} • ${cp.difficulty || 'Medium'}`,
      type: 'coding',
      link: `/coding/problem/${cp.slug || cp._id}`,
    }));

    const formattedMockTests = mockTests.map((m) => ({
      id: m._id,
      title: m.title,
      subtitle: `${m.durationMinutes} mins • ${m.totalQuestions} Questions • ${m.difficulty || 'Medium'}`,
      type: 'mock_test',
      link: `/mock-tests/${m.slug || m._id}`,
    }));

    // Deduplicate aptitude topics/subcategories
    const seenTopics = new Set();
    const formattedAptitude = [];
    for (const a of aptitudeTopics) {
      const topicName = a.topic || a.subcategory || a.category;
      if (topicName && !seenTopics.has(topicName.toLowerCase())) {
        seenTopics.add(topicName.toLowerCase());
        formattedAptitude.push({
          id: a._id,
          title: topicName,
          subtitle: `${a.category || 'Aptitude'} • Practice Questions`,
          type: 'aptitude',
          link: '/aptitude',
        });
        if (formattedAptitude.length >= limit) break;
      }
    }

    const totalResults =
      formattedCompanies.length +
      formattedResources.length +
      formattedCoding.length +
      formattedMockTests.length +
      formattedAptitude.length;

    res.status(200).json({
      success: true,
      data: {
        query: rawQuery,
        totalResults,
        companies: formattedCompanies,
        resources: formattedResources,
        coding: formattedCoding,
        mockTests: formattedMockTests,
        aptitude: formattedAptitude,
      },
    });
  } catch (error) {
    next(error);
  }
};

export default {
  globalSearch,
};
