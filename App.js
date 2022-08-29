import React from 'react';
import {ImageBackground, StatusBar, StyleSheet, Text, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

let utilities = function () {
  let setInitialTime = function (hours) {
    let startDate = new Date().setHours(hours);
    startDate = new Date(startDate).setMinutes(0);
    return new Date(new Date(startDate).setSeconds(0));
  };

  let addMinutes = function (dateOffset, minutes) {
    return new Date(dateOffset.getTime() + minutes * (1000 * 60));
  };

  let dTDiffInDays = function (startDate, endDate) {
    return Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
  };

  let dTDiffInMins = function (startDate, endDate) {
    return Math.round((endDate - startDate) / (1000 * 60));
  };

  return {setInitialTime, dTDiffInDays, dTDiffInMins, addMinutes};
};
let utilitiesFactory = new utilities();

let train = function (name, predicate) {
  let checkArrivalTime = function (dateTime) {
    if (predicate(dateTime)) return true;
    return false;
  };
  return {
    checkArrivalTime,
    name,
  };
};

let trainSchedulerEngine = function (trains) {
  let trainsFunctor = [...trains];

  let registerTrains = function (trains) {
    return trains.map(train => {
      trainsFunctor.push(train);
    });
  };

  let generateTrainSchedule = function (train, startDate, endDate) {
    if (utilitiesFactory.dTDiffInDays(startDate, endDate) > 1)
      throw 'not supported';
    let initialDate = startDate;
    let trainsSchedule = [];
    while (initialDate <= endDate) {
      if (train.checkArrivalTime(initialDate))
        trainsSchedule.push({
          train: train.name,
          expectedArrivalDate: initialDate,
          minutesToArrive: utilitiesFactory.dTDiffInMins(
            startDate,
            initialDate,
          ),
        });
      initialDate = new Date(initialDate.getTime() + 1 * (1000 * 60));
    }
    return trainsSchedule;
  };

  let getTrainScheduleBetweenDates = function (startDate, endDate) {
    return trainsFunctor.map(train => {
      return generateTrainSchedule(train, startDate, endDate);
    });
  };
  return {registerTrains, getTrainScheduleBetweenDates};
};

let trains = [
  new train('Central Station', dateTime => {
    return dateTime.getMinutes() % 20 == 0;
  }),
  new train('Circular', dateTime => {
    return dateTime.getMinutes() == 0;
  }),
  new train('North Square', dateTime => {
    return (
      dateTime.getHours() >= 7 &&
      dateTime.getHours() <= 22 &&
      dateTime.getMinutes() % 12 == 0
    );
  }),
  new train('West Market', dateTime => {
    return (
      dateTime.getHours() + dateTime.getMinutes() >= 35 &&
      dateTime.getHours() + dateTime.getMinutes() <= 31 &&
      dateTime.getMinutes() % 6 == 0
    );
  }),
];

// simple header text
class NTIHeader extends React.Component {
  constructor(props) {
    super(props);
    this.title = props.title;
  }
  render() {
    return <Text style={styles.sectionTitle}>{this.props.title}</Text>;
  }
}

class ScheduledTrainTable extends React.Component {
  constructor(props) {
    super(props);
    this.initialSetHours = props.initialSetHours;
    this.schedulerMinutes = props.schedulerMinutes;
    this.pageSize = props.pageSize;
    this.state = {
      data: [],
      startSchedulerDate: this.setInitialTime(this.initialSetHours),
    };
  }

  componentDidMount() {
    this.schedulerTick();
    this.timerId = setInterval(() => this.schedulerTick(), 1000 * 5);
  }

  componentWillUnmount() {
    clearInterval(this.timerId);
  }

  setInitialTime(hours) {
    let startDate = new Date().setHours(hours);
    startDate = new Date(startDate).setMinutes(0);
    return new Date(new Date(startDate).setSeconds(0));
  }

  addMinutes(dateOffset, minutes) {
    return new Date(dateOffset.getTime() + minutes * (1000 * 60));
  }

  schedulerTick() {
    let engine = new trainSchedulerEngine(trains);
    let endSchedulerDate = this.addMinutes(this.state.startSchedulerDate, 15);
    endSchedulerDate = new Date(endSchedulerDate).setSeconds(0);

    let rawData = engine.getTrainScheduleBetweenDates(
      new Date(this.state.startSchedulerDate),
      new Date(endSchedulerDate),
    );
    let flattenData = rawData.reduce((a, b) => {
      return a.concat(b);
    });
    let sortedData = flattenData.sort((a, b) => {
      return a.expectedArrivalDate - b.expectedArrivalDate;
    });

    let pagedData = sortedData.slice(0, this.pageSize).map((v, i) => {
      return {
        station: v.train,
        expectedArrivalDate: v.expectedArrivalDate,
        minutesToArrive: v.minutesToArrive,
      };
    });

    this.setState((prevState, props) => {
      return {
        data: pagedData,
        startSchedulerDate: this.addMinutes(
          prevState.startSchedulerDate,
          this.schedulerMinutes,
        ),
      };
    });
  }
  render() {
    return (
      <LinearGradient
        colors={['#4c669f', '#3b5998', '#192f6a']}
        style={styles.sectionContainer}>
        {this.state.data.map((value, idx) => (
          <LinearGradient
            colors={['#009FFD', '#2A2A72']}
            style={styles.subcontainer}>
            <Text style={styles.traintext}>
              {idx + 1} ) - {value.station}
            </Text>
            <Text style={styles.timetext}>
              {value.minutesToArrive + ' min'}
            </Text>
          </LinearGradient>
        ))}
      </LinearGradient>
    );
  }
}

//our clock
class Clock extends React.Component {
  constructor(props) {
    super(props);

    let startDate = new Date().setHours(props.initialSetTime);
    startDate = new Date(startDate).setMinutes(0);
    startDate = new Date(startDate).setSeconds(0);
    this.state = {localTime: new Date(startDate)};
  }

  componentDidMount() {
    this.timerId = setInterval(() => this.tick(), 1000);
  }

  componentWillUnmount() {
    clearInterval(this.timerId);
  }

  // update state
  tick() {
    this.setState(preState => ({
      localTime: new Date(new Date(preState.localTime).getTime() + 1000 * 60),
    }));
  }
  render() {
    return (
      <Text style={styles.timing}>
        {this.state.localTime.toLocaleTimeString()}
      </Text>
    );
  }
}

class NextTrain extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <ImageBackground
        source={{
          uri: 'https://i.pinimg.com/originals/55/d9/a0/55d9a07286895a7ac6501fe96a0a4753.jpg',
        }}
        style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
        <StatusBar animated={true} backgroundColor="#192f6a" />
        <NTIHeader title={'When will i get my Train !'} />
        <ScheduledTrainTable
          initialSetHours={5}
          schedulerMinutes={15}
          pageSize={3}
        />
        <View style={{position: 'absolute', bottom: 20, alignSelf: 'center'}}>
          <Clock initialSetTime={5} />
        </View>
      </ImageBackground>
    );
  }
}

//main App Export
class App extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return <NextTrain />;
  }
}

const styles = StyleSheet.create({
  sectionContainer: {
    flexDirection: 'column',
    borderWidth: 5,
    borderColor: 'white',
    marginVertical: 10,
    width: '90%',
    alignSelf: 'center',
    padding: 20,
    borderRadius: 20,
    elevation: 5,
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 30,
    color: 'white',
    position: 'absolute',
    top: 20,
  },
  subcontainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: 'white',
    marginVertical: 10,
    width: '90%',
    alignSelf: 'center',
    padding: 20,
    borderRadius: 20,
    elevation: 8,

    shadowColor: 'pink',
    alignItems: 'center',
  },
  traintext: {
    fontSize: 20,
    flex: 1,
    color: 'white',
    fontWeight: '700',
  },
  timetext: {fontSize: 17, color: 'white', fontWeight: '700'},
  timing: {
    fontSize: 30,
    alignSelf: 'center',
    color: '#fff',
    fontWeight: '600',
  },
});

export default App;
