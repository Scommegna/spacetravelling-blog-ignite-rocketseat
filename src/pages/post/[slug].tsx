import { GetStaticPaths, GetStaticProps } from 'next';

import { getPrismicClient } from '../../services/prismic';

import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';

import format from 'date-fns/format';
import ptBr from 'date-fns/locale/pt-BR';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { useEffect, useState } from 'react';

import { useRouter } from 'next/router';

interface Post {
  uid: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
    banner: {
      url: string;
    };
    content: {
      heading: string;
      body: {
        type: string;
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  // State to store read-time data and router to sinalize fallback from staticPaths
  const [timeToRead, setTimeToRead] = useState(0);
  const router = useRouter();

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  // Calculates reading time
  let wordAcumulator: number = 0;

  function wordCount(str: string) {
    const wordCount = str.split(' ').length;
    wordAcumulator += wordCount;

    return wordAcumulator;
  }

  useEffect(() => {
    setTimeToRead(Math.ceil(wordAcumulator / 200));
  }, []);

  return (
    <article className={styles.postContainer}>
      <div className={styles.bannerContainer}>
        <img
          className={styles.banner}
          src={post.data.banner.url}
          alt="post banner"
        />
      </div>
      <main className={styles.mainContainer}>
        <div className={styles.headingContainer}>
          <h1 className={styles.heading}>{post.data.title}</h1>
          <div className={styles.headingInfo}>
            <div className={styles.headingData}>
              <FiCalendar className={styles.icon} />
              <time>
                {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                  locale: ptBr,
                })}
              </time>
            </div>
            <div className={styles.headingData}>
              <FiUser className={styles.icon} />
              <p>{post.data.author}</p>
            </div>
            <div className={styles.headingData}>
              <FiClock className={styles.icon} />
              <p>{`${timeToRead} min`}</p>
            </div>
          </div>
          <div className={styles.mainContentBox}>
            {post.data.content.map(content => {
              return (
                <div key={content.heading} className={styles.paragraphBox}>
                  <h2 className={styles.contentHeading}>{content.heading}</h2>
                  <div>
                    {content.body.map(paragraph => {
                      const paragraphKey = wordCount(paragraph.text);
                      return (
                        <p key={paragraphKey} className={styles.paragraph}>
                          {paragraph.text}
                        </p>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </article>
  );
}

// Routes that will be statically generated
export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient({});
  const posts = await prismic.getByType('posts');

  const paths = posts.results.map(post => {
    return {
      params: { slug: `${post.uid}` },
    };
  });

  return {
    paths,
    fallback: true,
  };
};

// All post data-fetch from staticProps
export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient({});
  const response = await prismic.getByUID('posts', String(slug), {});

  const post: Post = {
    first_publication_date: response.first_publication_date,
    uid: response.uid,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: { url: response.data.banner.url },
      author: response.data.author,
      content: response.data.content,
    },
  };

  return {
    props: { post },
    revalidate: 60 * 30, //30 minutes
  };
};
