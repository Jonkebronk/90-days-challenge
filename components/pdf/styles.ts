import { StyleSheet, Font } from '@react-pdf/renderer'

// Register fonts (using system fonts)
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'Helvetica' },
    { src: 'Helvetica-Bold', fontWeight: 'bold' },
    { src: 'Helvetica-Oblique', fontStyle: 'italic' },
  ],
})

// Colors
export const colors = {
  gold: '#FFD700',
  goldDark: '#B8860B',
  black: '#000000',
  darkGray: '#333333',
  gray: '#666666',
  lightGray: '#999999',
  white: '#FFFFFF',
  background: '#FAFAFA',
}

// Styles
export const styles = StyleSheet.create({
  // Page styles
  page: {
    flexDirection: 'column',
    backgroundColor: colors.white,
    paddingTop: 50,
    paddingBottom: 60,
    paddingHorizontal: 50,
    fontFamily: 'Helvetica',
  },

  // Cover page
  coverPage: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.darkGray,
    padding: 50,
  },
  coverTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.gold,
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: 3,
  },
  coverSubtitle: {
    fontSize: 24,
    color: colors.white,
    textAlign: 'center',
    marginBottom: 40,
    letterSpacing: 1,
  },
  coverLine: {
    width: 150,
    height: 3,
    backgroundColor: colors.gold,
    marginVertical: 30,
  },
  coverDate: {
    fontSize: 12,
    color: colors.lightGray,
    marginTop: 60,
  },

  // Table of Contents
  tocPage: {
    flexDirection: 'column',
    backgroundColor: colors.white,
    paddingTop: 50,
    paddingBottom: 60,
    paddingHorizontal: 50,
  },
  tocTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.gold,
    marginBottom: 30,
    textAlign: 'center',
    letterSpacing: 2,
  },
  tocItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  tocChapterTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.darkGray,
  },
  tocArticleTitle: {
    fontSize: 11,
    color: colors.gray,
    paddingLeft: 20,
  },
  tocPageNumber: {
    fontSize: 11,
    color: colors.gray,
  },
  tocDots: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomStyle: 'dotted',
    borderBottomColor: colors.lightGray,
    marginHorizontal: 10,
    marginBottom: 4,
  },

  // Chapter header
  chapterPage: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.darkGray,
    padding: 50,
  },
  chapterNumber: {
    fontSize: 14,
    color: colors.gold,
    letterSpacing: 3,
    marginBottom: 10,
  },
  chapterTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
    textAlign: 'center',
    letterSpacing: 2,
  },
  chapterLine: {
    width: 100,
    height: 2,
    backgroundColor: colors.gold,
    marginTop: 20,
  },

  // Article styles
  articleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.darkGray,
    marginBottom: 15,
    marginTop: 20,
  },
  articleMeta: {
    flexDirection: 'row',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  articleMetaItem: {
    fontSize: 9,
    color: colors.gray,
    marginRight: 15,
  },
  articleContent: {
    fontSize: 11,
    color: colors.darkGray,
    lineHeight: 1.6,
  },

  // Typography
  h1: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.darkGray,
    marginTop: 20,
    marginBottom: 10,
  },
  h2: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.darkGray,
    marginTop: 15,
    marginBottom: 8,
  },
  h3: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.darkGray,
    marginTop: 12,
    marginBottom: 6,
  },
  paragraph: {
    fontSize: 11,
    color: colors.darkGray,
    lineHeight: 1.6,
    marginBottom: 10,
    textAlign: 'justify',
  },
  bold: {
    fontWeight: 'bold',
  },
  italic: {
    fontStyle: 'italic',
  },

  // Lists
  listItem: {
    flexDirection: 'row',
    marginBottom: 5,
    paddingLeft: 10,
  },
  listBullet: {
    fontSize: 11,
    color: colors.gold,
    marginRight: 8,
    width: 15,
  },
  listContent: {
    fontSize: 11,
    color: colors.darkGray,
    flex: 1,
    lineHeight: 1.5,
  },

  // Numbered list
  numberedListItem: {
    flexDirection: 'row',
    marginBottom: 5,
    paddingLeft: 10,
  },
  numberedListNumber: {
    fontSize: 11,
    color: colors.gold,
    fontWeight: 'bold',
    marginRight: 8,
    width: 20,
  },

  // Blockquote
  blockquote: {
    backgroundColor: colors.background,
    borderLeftWidth: 3,
    borderLeftColor: colors.gold,
    padding: 10,
    marginVertical: 10,
    marginLeft: 10,
  },
  blockquoteText: {
    fontSize: 11,
    color: colors.gray,
    fontStyle: 'italic',
    lineHeight: 1.5,
  },

  // Image
  image: {
    maxWidth: '100%',
    marginVertical: 15,
  },
  imageCaption: {
    fontSize: 9,
    color: colors.gray,
    textAlign: 'center',
    marginTop: 5,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 50,
    right: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 9,
    color: colors.lightGray,
  },
  pageNumber: {
    fontSize: 9,
    color: colors.gray,
  },

  // Separator
  separator: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: 20,
  },
  goldSeparator: {
    height: 2,
    backgroundColor: colors.gold,
    marginVertical: 20,
  },
})
