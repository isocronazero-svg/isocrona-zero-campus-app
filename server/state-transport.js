function createStateTransport(dependencies = {}) {
  const {
    buildCampusGroupAttachmentUrl,
    buildIndependentTestAttemptAudiencePayload,
    buildMemberNotificationAudiencePayload,
    buildTestZoneQuestionAudiencePayload,
    buildTestZoneResultAudiencePayload,
    canAccessCampusGroup,
    findAssociateForAccount,
    isAssociateAccessLimitedByQuota,
    isCoursePublicAccess,
    listTestZoneResultsForOwner,
    listTestZoneReviewMarksForOwner,
    listVisibleIndependentTestModules,
    listVisibleIndependentTests,
    listVisibleMemberNotifications,
    normalizeCourseAccessScope
  } = dependencies;

  function compactCampusAttachmentForTransport(attachment, groupId, moduleId, category, entryId) {
    if (!attachment) {
      return null;
    }
    return {
      ...attachment,
      contentBase64: "",
      transportUrl: buildCampusGroupAttachmentUrl(groupId, moduleId, category, entryId)
    };
  }

  function compactCampusGroupsForTransport(campusGroups = []) {
    return (Array.isArray(campusGroups) ? campusGroups : []).map((group) => {
      const compactCategoryEntries = (entries, moduleId, category) =>
        (Array.isArray(entries) ? entries : []).map((entry) => ({
          ...entry,
          attachment: compactCampusAttachmentForTransport(
            entry?.attachment,
            group?.id,
            moduleId,
            category,
            entry?.id
          )
        }));

      return {
        ...group,
        documents: compactCategoryEntries(group.documents, "", "documents"),
        practiceSheets: compactCategoryEntries(group.practiceSheets, "", "practiceSheets"),
        videos: compactCategoryEntries(group.videos, "", "videos"),
        links: compactCategoryEntries(group.links, "", "links"),
        modules: (Array.isArray(group.modules) ? group.modules : []).map((module) => ({
          ...module,
          documents: compactCategoryEntries(module.documents, module.id, "documents"),
          practiceSheets: compactCategoryEntries(module.practiceSheets, module.id, "practiceSheets"),
          videos: compactCategoryEntries(module.videos, module.id, "videos"),
          links: compactCategoryEntries(module.links, module.id, "links")
        }))
      };
    });
  }

  function stripAccountSecrets(account) {
    if (!account || typeof account !== "object") {
      return account;
    }

    const {
      password,
      passwordHash,
      sessionToken,
      resetToken,
      authToken,
      accessToken,
      refreshToken,
      ...safeAccount
    } = account;

    return safeAccount;
  }

  function stripSmtpSecrets(smtp) {
    if (!smtp || typeof smtp !== "object") {
      return smtp;
    }

    return {
      ...smtp,
      password: "",
      clientSecret: "",
      accessToken: "",
      refreshToken: ""
    };
  }

  function sanitizeStateForTransport(state) {
    if (!state || typeof state !== "object") {
      return state;
    }

    return {
      ...state,
      accounts: (state.accounts || []).map(stripAccountSecrets),
      settings: {
        ...(state.settings || {}),
        smtp: stripSmtpSecrets(state.settings?.smtp || {})
      }
    };
  }

  function restoreTransportSanitizedSecrets(currentState, nextState) {
    if (!nextState || typeof nextState !== "object") {
      return nextState;
    }

    const currentAccounts = new Map((currentState.accounts || []).map((item) => [item.id, item]));
    nextState.accounts = (nextState.accounts || []).map((account) => {
      const currentAccount = currentAccounts.get(account.id);
      if (!currentAccount) {
        return account;
      }

      return {
        ...account,
        password:
          typeof account.password === "string" && account.password.trim()
            ? account.password
            : currentAccount.password || "",
        passwordHash:
          typeof account.passwordHash === "string" && account.passwordHash.trim()
            ? account.passwordHash
            : currentAccount.passwordHash || "",
        sessionToken:
          typeof account.sessionToken === "string" && account.sessionToken.trim()
            ? account.sessionToken
            : currentAccount.sessionToken || "",
        resetToken:
          typeof account.resetToken === "string" && account.resetToken.trim()
            ? account.resetToken
            : currentAccount.resetToken || "",
        authToken:
          typeof account.authToken === "string" && account.authToken.trim()
            ? account.authToken
            : currentAccount.authToken || "",
        accessToken:
          typeof account.accessToken === "string" && account.accessToken.trim()
            ? account.accessToken
            : currentAccount.accessToken || "",
        refreshToken:
          typeof account.refreshToken === "string" && account.refreshToken.trim()
            ? account.refreshToken
            : currentAccount.refreshToken || ""
      };
    });

    nextState.settings = {
      ...(nextState.settings || {}),
      smtp: {
        ...(nextState.settings?.smtp || {}),
        password:
          typeof nextState.settings?.smtp?.password === "string" && nextState.settings.smtp.password.trim()
            ? nextState.settings.smtp.password
            : currentState.settings?.smtp?.password || "",
        clientSecret:
          typeof nextState.settings?.smtp?.clientSecret === "string" && nextState.settings.smtp.clientSecret.trim()
            ? nextState.settings.smtp.clientSecret
            : currentState.settings?.smtp?.clientSecret || "",
        accessToken:
          typeof nextState.settings?.smtp?.accessToken === "string" && nextState.settings.smtp.accessToken.trim()
            ? nextState.settings.smtp.accessToken
            : currentState.settings?.smtp?.accessToken || "",
        refreshToken:
          typeof nextState.settings?.smtp?.refreshToken === "string" && nextState.settings.smtp.refreshToken.trim()
            ? nextState.settings.smtp.refreshToken
            : currentState.settings?.smtp?.refreshToken || ""
      }
    };

    return nextState;
  }

  function buildMemberTestResultAudiencePayload(result) {
    return {
      id: String(result?.id || "").trim(),
      resultType: String(result?.resultType || "normal").trim() || "normal",
      userId: String(result?.userId || "").trim(),
      memberId: String(result?.memberId || "").trim(),
      questionIds: Array.isArray(result?.questionIds)
        ? result.questionIds.map((questionId) => String(questionId || "").trim()).filter(Boolean)
        : [],
      correctCount: Number(result?.correctCount ?? result?.score ?? 0),
      wrongCount: Number(result?.wrongCount || 0),
      blankCount: Number(result?.blankCount || 0),
      score: Number(result?.score ?? result?.correctCount ?? 0),
      total: Number(result?.total || (Array.isArray(result?.questionIds) ? result.questionIds.length : 0)),
      percentage: Number(result?.percentage ?? result?.scorePercent ?? 0),
      scorePercent: Number(result?.scorePercent ?? result?.percentage ?? 0),
      duration: Number(result?.duration || 0),
      selectedConfig: result?.selectedConfig && typeof result.selectedConfig === "object" ? result.selectedConfig : {},
      createdAt: String(result?.createdAt || "").trim()
    };
  }

  function buildMemberScopedState(state, account, memberIdOverride) {
    const memberId = memberIdOverride || account.memberId || "";
    const scopedMember = (state.members || []).find((item) => item.id === memberId) || null;
    const associateId = scopedMember?.associateId || account.associateId || "";
    const memberEmail = String(scopedMember?.email || account.email || "").toLowerCase();
    const campusOnlyAccess = !associateId;
    const scopedAssociate = findAssociateForAccount(state, account, scopedMember);
    const quotaLimitedAccess = !campusOnlyAccess && isAssociateAccessLimitedByQuota(scopedAssociate);
    const memberOwnedCourseIds = quotaLimitedAccess
      ? new Set()
      : new Set(
          (state.courses || [])
            .filter((course) => {
              const hasEnrollment = (course.enrolledIds || []).includes(memberId);
              const isWaiting = (course.waitingIds || []).includes(memberId);
              const hasDiploma = (course.diplomaReady || []).includes(memberId);
              const hasSubmission = (course.enrollmentSubmissions || []).some((item) => item.memberId === memberId);
              return hasEnrollment || isWaiting || hasDiploma || hasSubmission;
            })
            .map((course) => course.id)
        );
    const visibleCourses = quotaLimitedAccess
      ? []
      : (state.courses || []).filter((course) => {
          if (!campusOnlyAccess) {
            return true;
          }
          if (!isCoursePublicAccess(course)) {
            return false;
          }
          if (!memberOwnedCourseIds.size) {
            return true;
          }
          return memberOwnedCourseIds.has(course.id);
        })
        .map((course) => {
        const isEnrolled = (course.enrolledIds || []).includes(memberId);
        const isWaiting = (course.waitingIds || []).includes(memberId);
        const hasDiploma = (course.diplomaReady || []).includes(memberId);
        const mailSent = (course.mailsSent || []).includes(memberId);
        const ownAttendance = memberId ? { [memberId]: course.attendance?.[memberId] ?? 0 } : {};
        const ownEvaluations = memberId
          ? { [memberId]: course.evaluations?.[memberId] ?? "Pendiente" }
          : {};
        const ownProgress = memberId
          ? { [memberId]: course.contentProgress?.[memberId] || { lessonIds: [], blockIds: [], updatedAt: "" } }
          : {};
        const ownEnrollmentSubmissions = (course.enrollmentSubmissions || []).filter((item) => item.memberId === memberId);

        return {
          ...course,
          accessScope: normalizeCourseAccessScope(course.accessScope, course.audience),
          enrolledCount: (course.enrolledIds || []).length,
          waitingCount: (course.waitingIds || []).length,
          diplomaReadyCount: (course.diplomaReady || []).length,
          mailsSentCount: (course.mailsSent || []).length,
          enrolledIds: isEnrolled ? [memberId] : [],
          waitingIds: isWaiting ? [memberId] : [],
          diplomaReady: hasDiploma ? [memberId] : [],
          mailsSent: mailSent ? [memberId] : [],
          attendance: ownAttendance,
          evaluations: ownEvaluations,
          contentProgress: ownProgress,
          enrollmentSubmissions: ownEnrollmentSubmissions
        };
      });
    const selectedCourseId = visibleCourses.some((course) => course.id === state.selectedCourseId)
      ? state.selectedCourseId
      : visibleCourses[0]?.id || null;
    const scopedTestZoneResults = listTestZoneResultsForOwner(state, { ...account, memberId }).map(
      buildTestZoneResultAudiencePayload
    );
    const scopedTestZoneReviewMarks = listTestZoneReviewMarksForOwner(state, { ...account, memberId }).map((mark) => ({
      id: String(mark.id || "").trim(),
      userId: String(mark.userId || mark.accountId || "").trim(),
      memberId: String(mark.memberId || "").trim(),
      questionId: String(mark.questionId || "").trim(),
      status: String(mark.status || "").trim(),
      source: String(mark.source || "").trim(),
      createdAt: String(mark.createdAt || "").trim(),
      updatedAt: String(mark.updatedAt || "").trim(),
      reviewedAt: String(mark.reviewedAt || "").trim(),
      reviewedResultId: String(mark.reviewedResultId || "").trim(),
      reviewedFailureAt: String(mark.reviewedFailureAt || "").trim()
    }));
    const visibleTestsAccount = { ...account, role: "member" };
    const ownTestResults = (state.testResults || [])
      .filter((item) => item.userId === account.id || item.memberId === memberId)
      .filter((item) => String(item.resultType || "normal").trim() !== "live")
      .map(buildMemberTestResultAudiencePayload);

    return {
      role: "member",
      activeView: quotaLimitedAccess ? "join" : state.activeView,
      selectedMemberId: memberId || null,
      selectedAssociateId: associateId || null,
      selectedCourseId,
      selectedAssociateApplicationId: null,
      selectedAssociatePaymentSubmissionId: null,
      selectedAssociateProfileRequestId: null,
      associateApplications: [],
      associatePaymentSubmissions: (state.associatePaymentSubmissions || []).filter(
        (item) => item.associateId === associateId || item.memberId === memberId
      ),
      associateProfileRequests: (state.associateProfileRequests || []).filter(
        (item) => item.associateId === associateId || item.memberId === memberId
      ),
      automationInbox: [],
      automationMeta: {
        lastRunAt: "",
        lastReason: "",
        lastSummary: null
      },
      agentLog: [],
      activityLog: (state.activityLog || []).filter(
        (item) => item.actor === account.name || item.type === "member"
      ),
      accounts: (state.accounts || [])
        .filter((item) => item.id === account.id)
        .map(stripAccountSecrets),
      members: (state.members || []).filter((item) => item.id === memberId),
      associates: (state.associates || []).filter(
        (item) => item.id === associateId || item.email.toLowerCase() === memberEmail
      ),
      emailOutbox: quotaLimitedAccess
        ? []
        : (state.emailOutbox || []).filter((item) => item.memberId === memberId || item.associateId === associateId),
      memberNotifications: listVisibleMemberNotifications(state, memberId).map((notification) =>
        buildMemberNotificationAudiencePayload(notification, memberId)
      ),
      testZoneQuestions: (state.testZoneQuestions || []).map(buildTestZoneQuestionAudiencePayload),
      testZoneResults: scopedTestZoneResults,
      testZoneReviewMarks: scopedTestZoneReviewMarks,
      testZoneLiveSessions: [],
      testModules: quotaLimitedAccess ? [] : listVisibleIndependentTestModules(state, visibleTestsAccount),
      tests: quotaLimitedAccess ? [] : listVisibleIndependentTests(state, visibleTestsAccount),
      questions: [],
      testAttempts: (state.testAttempts || [])
        .filter((attempt) => String(attempt.memberId || "").trim() === String(memberId || "").trim())
        .map(buildIndependentTestAttemptAudiencePayload),
      testResults: quotaLimitedAccess ? [] : ownTestResults,
      liveTestSessions: [],
      liveTestPlayers: [],
      liveTestAnswers: [],
      liveTestPublicSessions: [],
      liveTestParticipantResults: [],
      settings: {
        ...state.settings,
        smtp: stripSmtpSecrets({
          host: "",
          port: 0,
          secure: true,
          startTls: false,
          username: "",
          password: "",
          fromEmail: "",
          fromName: state.settings?.organization || "Isocrona Zero Campus",
          testTo: ""
        }),
        agent: {
          enabled: false,
          canResolveInbox: false,
          canSendDiplomas: false,
          canCloseCourses: false,
          notes: ""
        }
      },
      campusGroups: campusOnlyAccess || quotaLimitedAccess
        ? []
        : (state.campusGroups || []).filter((group) =>
            canAccessCampusGroup(state, { ...account, memberId, associateId }, group)
          ),
      courses: visibleCourses
    };
  }

  function mergeMemberScopedStateIntoFullState(fullState, scopedState, account) {
    const memberId = account.memberId || "";
    if (!memberId) {
      return structuredClone(fullState);
    }

    const nextState = structuredClone(fullState);
    const member = (nextState.members || []).find((item) => item.id === memberId) || null;
    const associate = findAssociateForAccount(nextState, account, member);
    if (isAssociateAccessLimitedByQuota(associate)) {
      return nextState;
    }

    const scopedCourses = Array.isArray(scopedState?.courses) ? scopedState.courses : [];

    for (const scopedCourse of scopedCourses) {
      const course = (nextState.courses || []).find((item) => item.id === scopedCourse.id);
      if (!course) {
        continue;
      }

      const scopedProgress = scopedCourse.contentProgress?.[memberId];
      if (scopedProgress) {
        course.contentProgress = course.contentProgress || {};
        course.contentProgress[memberId] = {
          lessonIds: Array.isArray(scopedProgress.lessonIds)
            ? [...new Set(scopedProgress.lessonIds.map((item) => String(item).trim()).filter(Boolean))]
            : [],
          blockIds: Array.isArray(scopedProgress.blockIds)
            ? [...new Set(scopedProgress.blockIds.map((item) => String(item).trim()).filter(Boolean))]
            : [],
          updatedAt: scopedProgress.updatedAt || new Date().toISOString()
        };
      }

      const scopedFeedback = Array.isArray(scopedCourse.feedbackResponses)
        ? scopedCourse.feedbackResponses.find((response) => response.memberId === memberId)
        : null;
      if (scopedFeedback) {
        course.feedbackResponses = [
          ...((course.feedbackResponses || []).filter((response) => response.memberId !== memberId)),
          {
            ...scopedFeedback,
            id: scopedFeedback.id || `feedback-${Date.now()}`,
            memberId,
            submittedAt: scopedFeedback.submittedAt || new Date().toISOString(),
            activityScore: Number(scopedFeedback.activityScore || 0),
            contentsScore: Number(scopedFeedback.contentsScore || 0),
            organizationScore: Number(scopedFeedback.organizationScore || 0),
            teacherClarityScore: Number(scopedFeedback.teacherClarityScore || 0),
            teacherUsefulnessScore: Number(scopedFeedback.teacherUsefulnessScore || 0),
            teacherSupportScore: Number(scopedFeedback.teacherSupportScore || 0),
            recommendationScore: Number(scopedFeedback.recommendationScore || 0),
            comment: String(scopedFeedback.comment || "").trim(),
            teacherComment: String(scopedFeedback.teacherComment || "").trim()
          }
        ];
      }
    }

    return nextState;
  }

  function sanitizeStateForAccount(state, account) {
    if (!account) {
      return state;
    }

    if (account.role === "admin") {
      return state;
    }

    const nextState = buildMemberScopedState(state, account);
    nextState.liveTestSessions = [];
    nextState.liveTestPlayers = [];
    nextState.liveTestAnswers = [];
    nextState.liveTestPublicSessions = [];
    nextState.liveTestParticipantResults = [];
    return nextState;
  }

  function prepareStateForTransport(state, account) {
    const baseState = sanitizeStateForTransport(sanitizeStateForAccount(state, account));
    return {
      ...baseState,
      campusGroups: compactCampusGroupsForTransport(baseState.campusGroups || [])
    };
  }

  return {
    buildMemberScopedState,
    compactCampusAttachmentForTransport,
    compactCampusGroupsForTransport,
    mergeMemberScopedStateIntoFullState,
    prepareStateForTransport,
    restoreTransportSanitizedSecrets,
    sanitizeStateForAccount,
    sanitizeStateForTransport,
    stripAccountSecrets,
    stripSmtpSecrets
  };
}

module.exports = {
  createStateTransport
};
