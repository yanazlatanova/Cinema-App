import React from 'react';
import { useStates } from '../utilities/states';

import { Card, Row, Col, Container, Button } from 'react-bootstrap';

export default function Movie({ projection }) {

    const s = useStates('main');
    const movie = s.movies.find(movie => movie.id === projection.movieId);

    console.log(movie.description.posterImage);
    const posterImage = 'https://cinema-rest.nodehill.se' + movie.description.posterImage;

    function formatMovieLength(minutes) {
        if (isNaN(minutes) || minutes < 0) {
            return 'Invalid input';
        }

        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;

        return `${hours} h ${remainingMinutes} min`;
    }


    function booking() {
        alert('Thank you for your booking!');
    }

    return (
        <Container >
            <Card className='movie'>
                <Row className="g-0">
                    <Col md={2}>
                        <Card.Img src={posterImage} alt="Card Image" />
                    </Col>
                    <Col md={8}>
                        <Card.Body>
                            <Card.Title>{movie.title}</Card.Title>
                            <Card.Text className='length'>
                                {<span>{formatMovieLength(movie.description.length)} </span>}
                            </Card.Text>
                            <Card.Text>
                                <small className="categories text-muted">{movie.description.categories.map(category => <span> {category + " "} </span>)}</small>
                            </Card.Text>
                        </Card.Body>
                    </Col>
                    <Col md={2} className="d-flex justify-content-center align-items-center">
                        <Button onClick={booking} variant="primary" className='btn-book'>BOOK</Button>
                    </Col>
                </Row>
            </Card>
        </Container>
    );
};
