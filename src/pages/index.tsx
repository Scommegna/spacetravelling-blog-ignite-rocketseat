import { GetStaticProps } from 'next';
import Head from 'next/head';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

import { format } from 'date-fns';
import ptBr from 'date-fns/locale/pt-BR';

import { FiCalendar, FiUser } from 'react-icons/fi';
import Link from 'next/link';
import { useState } from 'react';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  // State for posts data and with next page data
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);

  // loads new posts data from next page property
  function loadNextPageResults() {
    fetch(nextPage)
      .then(resp => resp.json())
      .then(data => {
        // data treatment and state update
        const actualPosts = posts.map(post => post);
        const newPosts = data.results.map((post: Post) => {
          return {
            uid: post.uid,
            first_publication_date: post.first_publication_date,
            data: {
              title: post.data.title,
              subtitle: post.data.subtitle,
              author: post.data.author,
            },
          };
        });

        if (data.next_page) {
          setNextPage(data.next_page);
        } else {
          setNextPage(null);
        }

        actualPosts.push(...newPosts);

        setPosts(actualPosts);
      });
  }

  // Main page component
  return (
    <>
      <Head>
        <title>Home | spacetraveling</title>
      </Head>

      <main className={styles.main}>
        <div className={styles.contentContainer}>
          {posts.map(post => {
            return (
              <section key={post.uid} className={styles.postSection}>
                <Link href={`/post/${post.uid}`}>
                  <a>
                    <h2 className={styles.postTitle}>{post.data.title}</h2>
                  </a>
                </Link>
                <p className={styles.postSubtitle}>{post.data.subtitle}</p>
                <div className={styles.postInfoContainer}>
                  <div className={styles.subContainer}>
                    <FiCalendar className={styles.icon} />
                    <time className={styles.postInfo}>
                      {format(
                        new Date(post.first_publication_date),
                        'dd MMM yyyy',
                        {
                          locale: ptBr,
                        }
                      )}
                    </time>
                  </div>
                  <div className={styles.subContainer}>
                    <FiUser className={styles.icon} />
                    <p className={styles.postInfo}>{post.data.author}</p>
                  </div>
                </div>
              </section>
            );
          })}
          {nextPage ? (
            <p
              onClick={() => loadNextPageResults()}
              className={styles.morePosts}
            >
              Carregar mais posts
            </p>
          ) : (
            ''
          )}
        </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  // Gets post data
  const prismic = getPrismicClient({});
  const postsResponse = await prismic.getByType('posts', {
    pageSize: 2,
  });

  // Info that returns what is the content of the next page
  const nextPage = postsResponse.next_page;

  // Formats post data
  const postsFormatted = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  // All data that will be given on StaticProps
  const postsPagination: PostPagination = {
    next_page: nextPage,
    results: postsFormatted,
  };

  return {
    props: {
      postsPagination,
    },
  };
};
