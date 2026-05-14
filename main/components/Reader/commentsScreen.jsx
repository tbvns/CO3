import {
  ActivityIndicator,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
} from 'react-native';
import { useCallback, useEffect, useState } from "react"
import { fetchComments } from '../../web/worksScreen/fetchComments';
import HtmlTextRenderer from '../common/HtmlTextRenderer';
import { getJsonSettings } from '../../storage/jsonSettings';
import Icon from 'react-native-vector-icons/MaterialIcons';
import UserInfoScreen from '../../screens/UserInfo';

export const CommentsScreen = ({
  setCommentsVisible, currentTheme, singleChapter, workOrChapterId, setScreens,
  workDAO, libraryDAO, historyDAO, settingsDAO, progressDAO, kudoHistoryDAO, chapterDAO,
}) => {
  const [loading, setLoading] = useState(true);
  const [cannotNext, setCannotNext] = useState(true);
  const [step, setStep] = useState("Initializing");
  const [comments, setComments] = useState([]);
  const [preferHTML, setPreferHTML] = useState(false);
  const [minusList, setMinusList] = useState([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    asyncFetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [singleChapter, workOrChapterId, page])

  const asyncFetchComments = async () => {
    let preferHtml = (await getJsonSettings()).preferHtml;
    setPreferHTML(preferHtml);
    const _comments = await fetchComments(setCannotNext, setStep, preferHtml, singleChapter, workOrChapterId, page);
    setComments(p => [...p, ..._comments]);
    setLoading(false);
  }

  const renderAuthorPic = (authorImg) => {
    let url = "https://archiveofourown.org/images/skins/iconsets/default/icon_user.png";
    if (authorImg?.startsWith("https://archiveofourown.org/")) url = authorImg;

    return (<Image style={styles.commentPic} src={url} />)
  }

  const handlePress = (comment) => {
    if (comment.isBanner || comment.isDeleted) return;
    const commentId = comment.id;
    if (minusList.includes(commentId)) setMinusList(p => p.filter(cId => cId !== commentId));
    else setMinusList(p => [...p, commentId]);
  }

  const renderItem = ({ item }) => {
    return renderComment(item);
  }

  const renderComment = (comment, depth = 0) => (
    <TouchableOpacity key={comment.id} activeOpacity={0.4} onPress={() => handlePress(comment)} style={[styles.commentContainer, minusList.includes(comment.id) && { maxHeight: 59 }, { borderColor: currentTheme.borderColor }, depth > 0 && { marginLeft: 10 }]}>
      {comment.isBanner ? (
        <View style={[styles.specialCommentContainer, { backgroundColor: currentTheme.cardBackground }]}>
          <HtmlTextRenderer extraTagsStyles={{ a: { fontSize: 14 }, p: { color: currentTheme.primaryColor, marginBottom: 0 } }} html={comment.html} currentTheme={currentTheme} />
        </View>
      ) : comment.isDeleted ? (
        <View style={[styles.specialCommentContainer, { backgroundColor: currentTheme.cardBackground }]}>
          <Text style={[styles.deletedCommentText, { color: currentTheme.textColor }]}>
            Comment deleted
          </Text>
        </View>) : (
        <View style={[styles.innerCommentContainer, { backgroundColor: currentTheme.cardBackground }]}>
          {renderAuthorPic(comment.authorImg)}
          <View style={styles.commentTextContainer}>
            {comment.authorIsDeleted ? (
              <Text style={[styles.commentAuthor, { color: currentTheme.warningTextColor }]}>
                Deleted User
              </Text>
            ) : (
              <TouchableOpacity activeOpacity={0} onPress={() => {
                comment.username ? setScreens(p => {
                  return [...p,
                  <UserInfoScreen
                    username={comment.username}
                    currentTheme={currentTheme}
                    setScreens={setScreens}
                    onBack={() => setScreens(prev => prev.slice(0, -1))}
                    settingsDAO={settingsDAO}
                    historyDAO={historyDAO}
                    progressDAO={progressDAO}
                    kudoHistoryDAO={kudoHistoryDAO}
                    libraryDAO={libraryDAO}
                    workDAO={workDAO}
                    chapterDAO={chapterDAO}
                  />
                  ]
                }) : null;
              }}>
                <Text style={[styles.commentAuthor, { color: currentTheme.textColor }, comment.username ? { borderBottomWidth: 1, borderBottomColor: currentTheme.textColor } : {}]}>
                  {comment.author} {comment.authorIsGuest ? "(Guest)" : null /* The "??" operator is sometimes broken */}
                </Text>
              </TouchableOpacity>
            )}
            {minusList.includes(comment.id) ? (
              <Text style={[styles.commentAuthor, { color: currentTheme.secondaryTextColor }]}>
                Comment reduced
              </Text>
            ) : preferHTML ? (
              <HtmlTextRenderer extraTagsStyles={
                {
                  p: {
                    fontSize: 14,
                    paddingBottom: 12,
                  },
                  span: {
                    fontSize: 14,
                    paddingBottom: 12,
                  },
                  a: {
                    fontSize: 14,
                    paddingBottom: 12,
                  }
                }
              } html={comment.html} currentTheme={currentTheme} />)
              : (
                <Text style={[styles.commentContent, { color: currentTheme.textColor }]}>
                  {comment.content}
                </Text>)}
          </View>
        </View>)}
      <View>
        {comment.children.map((child) => renderComment(child, depth + 1))}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.backgroundColor }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={currentTheme.primaryColor} />
          <Text style={[styles.loadingText, { color: currentTheme.textColor }]}>
            Loading comments...
          </Text>
          <Text style={[styles.loadingStepText, { color: currentTheme.textColor }]}>
            {step}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!comments || comments.length < 1) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.backgroundColor }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: currentTheme.textColor }]}>
            No comments
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.backgroundColor }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setCommentsVisible(false)}>
          <Icon name="arrow-back" size={24} color={currentTheme.textColor} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: currentTheme.textColor }]}>
          Comments
        </Text>
      </View>
      <FlatList
        onEndReached={() => cannotNext || setPage(p => p + 1)}
        onEndReachedThreshold={0.5}
        data={comments}
        renderItem={renderItem}
        contentContainerStyle={styles.commentsContainer}
        ListFooterComponent={cannotNext && (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: currentTheme.textColor }]}>
              No more comments
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  loadingStepText: {
    marginTop: 6,
    fontSize: 14,
  },
  commentsContainer: {
    marginTop: 10,
    paddingBottom: 20,
    position: 'absolute',
    width: '100%',
    left: 0,
    flex: 1,
    justifyContent: 'center',
    gap: 10,
  },
  commentContainer: {
    flex: 1,
    gap: 5,
    borderLeftWidth: 1,
    marginLeft: 10,
    overflow: 'hidden',
  },
  commentGradient: {
    position: 'relative',
    top: 25,
    right: 0,
    height: 20,
    width: '100%',
  },
  deletedCommentText: {
    fontSize: 16,
  },
  specialCommentContainer: {
    borderRadius: 14,
    flex: 1,
    width: 'fit-content',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 4,
    marginHorizontal: 10,
  },
  innerCommentContainer: {
    gap: 10,
    borderRadius: 22,
    flex: 1,
    width: 'fit-content',
    justifyContent: 'flex-start',
    marginHorizontal: 10,
    flexDirection: 'row',
    paddingLeft: 2,
  },
  commentPic: {
    width: 50,
    height: 50,
    borderRadius: 20,
    marginVertical: 2,
  },
  commentTextContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  commentAuthor: {
    textAlign: 'left',
    fontSize: 16,
    fontWeight: 'bold',
  },
  commentContent: {
    textAlign: 'left',
    fontSize: 14,
  }
});